import tempfile
import os
import requests
import json
from typing import List

import numpy as np
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
from groq import Groq

from schemas import CVRequest
from pdf_utils import extract_text_from_pdf
from embeddings import search_jobs, embed, INDEX_PATH, META_PATH
from oracle_jobs import get_jobs

# ---------------- ENV ----------------
load_dotenv()

GROQ_API_KEY = os.getenv("GROQ_API_KEY")
MODEL = os.getenv("GROQ_MODEL", "llama-3.1-8b-instant")

if not GROQ_API_KEY:
    raise RuntimeError("Missing GROQ_API_KEY in .env")

client = Groq(api_key=GROQ_API_KEY)

# ---------------- FASTAPI ----------------
app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------------- Helper: call LLM ----------------
def ask_llm(prompt: str):
    chat = client.chat.completions.create(
        model=MODEL,
        messages=[{"role": "user", "content": prompt}],
        temperature=0.3
    )
    return chat.choices[0].message.content


# ---------------- CV ANALYSIS ----------------
@app.post("/analyze")
def analyze_cv(req: CVRequest):
    try:
        pdf = requests.get(req.cvUrl).content
        with tempfile.NamedTemporaryFile(delete=False, suffix=".pdf") as tmp:
            tmp.write(pdf)
            path = tmp.name

        text = extract_text_from_pdf(path)
        os.unlink(path)
        text = text[:4000]  # safety limit

        # Step 1: Analyze in English
        analysis_prompt = f"""
You are a professional CV reviewer.

Analyze the following CV and return STRICT JSON in this format:

{{
"strengths": [],
"weaknesses": [],
"improvements": []
}}

CV:
{text}
"""
        analysis_json = ask_llm(analysis_prompt)

        # Step 2: Translate to Romanian
        translate_prompt = f"""
Translate the following CV analysis into Romanian.

Convert it into clear readable text with this structure:

Puncte forte:
- ...

Puncte slabe:
- ...

Sugestii de îmbunătățire:
- ...

Analysis:
{analysis_json}
"""
        romanian_text = ask_llm(translate_prompt)

        return {"recommendations": romanian_text}

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ---------------- JOB MATCHING ----------------
@app.post("/suggestions")
def job_suggestions(req: CVRequest):
    try:
        pdf = requests.get(req.cvUrl).content
        with tempfile.NamedTemporaryFile(delete=False, suffix=".pdf") as tmp:
            tmp.write(pdf)
            path = tmp.name

        text = extract_text_from_pdf(path)
        os.unlink(path)
        text = text[:4000]

        top_jobs = search_jobs(text)

        prompt = f"""
Given this CV:

{text}

And these jobs:

{top_jobs}

Explain briefly why each job matches the candidate.
"""
        explanation = ask_llm(prompt)

        return {
            "matched_jobs": top_jobs,
            "explanation": explanation
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ---------------- JOB-TO-CV MATCHING ----------------
from pydantic import BaseModel
import faiss

class JobCVMatchRequest(BaseModel):
    jobId: int
    cvUrls: List[str]  # List of applicant CV PDF URLs

@app.post("/job-cv-match")
def job_cv_match(req: JobCVMatchRequest):
    """
    For a given job, rank all applicant CVs by fit percentage using pre-embedded job vectors.
    """
    try:
        # Load FAISS index and metadata
        index = faiss.read_index(INDEX_PATH)
        with open(META_PATH, encoding="utf-8") as f:
            jobs_meta = json.load(f)

        # Find the job
        job_meta = next((j for j in jobs_meta if j.get("id") == req.jobId or j.get("id_job") == req.jobId), None)
        if not job_meta:
            raise HTTPException(status_code=404, detail="Job not found")

        job_text = job_meta["text"]
        job_vector = embed(job_text).reshape(1, -1)  # use your existing embed()

        results = []

        for cv_url in req.cvUrls:
            pdf = requests.get(cv_url).content
            with tempfile.NamedTemporaryFile(delete=False, suffix=".pdf") as tmp:
                tmp.write(pdf)
                path = tmp.name

            cv_text = extract_text_from_pdf(path)[:4000]
            os.unlink(path)

            # Compute cosine similarity with job vector
            cv_vector = embed(cv_text).reshape(1, -1)
            similarity = float(np.dot(job_vector, cv_vector.T) / 
                               (np.linalg.norm(job_vector) * np.linalg.norm(cv_vector)))
            score = round(similarity * 100, 2)

            # Optional: LLM explanation
            explanation_prompt = f"""
Job description:

{job_text}

Candidate CV:

{cv_text}

Explain briefly why this candidate fits the job.
"""
            explanation = ask_llm(explanation_prompt)

            results.append({
                "cvUrl": cv_url,
                "fitScore": score,
                "explanation": explanation
            })

        # Sort descending by fitScore
        results = sorted(results, key=lambda x: x["fitScore"], reverse=True)

        return {
            "job": job_meta,
            "rankedCandidates": results
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))