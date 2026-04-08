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

#---------------- Job formatting ----------------
def format_job_for_ui(job, idx):
    # Map fields from your FAISS jobs to JobCard expected fields
    return {
        "ID_JOB": job.get("ID_JOB", idx + 1),
        "TITLU": job.get("TITLU") or job.get("title") or f"Job #{idx+1}",
        "DENUMIRE_COMPANIE": job.get("DENUMIRE_COMPANIE") or job.get("company") or "Companie",
        "LOCATIE": job.get("LOCATIE") or job.get("location") or "România",
        "SALARIU": job.get("SALARIU") or job.get("salary") or "",
        "TIP_JOB": job.get("TIP_JOB") or job.get("type") or "",
        "DESCRIERE": job.get("DESCRIERE") or job.get("description") or "Descriere lipsă",
        "DATA_POSTARII": job.get("DATA_POSTARII") or None,
        "LOGO": job.get("LOGO") or "https://via.placeholder.com/80",
    }

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

        # --- FAISS search fără limită ---
        top_jobs = search_jobs(text, top_k=20)

        # --- Format for UI ---
        formatted_jobs = [format_job_for_ui(job, idx) for idx, job in enumerate(top_jobs)]

        # --- Optional LLM explanation ---
        explanation = "Sugestii generate automat"

        return {
            "jobs": formatted_jobs,
            "explanation": explanation
        }

    except Exception as e:
        import traceback
        traceback.print_exc()
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