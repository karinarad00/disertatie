import re
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

# ---------------- Helper: parse LLM JSON safely ----------------
def parse_llm_json(response: str):
    """
    Extract JSON from LLM response, handling markdown/code fences.
    """
    # Try to extract JSON inside ```json ... ```
    match = re.search(r'```json(.*?)```', response, re.DOTALL)
    if match:
        json_text = match.group(1).strip()
    else:
        # fallback: try to find {...} directly
        match = re.search(r'\{.*\}', response, re.DOTALL)
        if match:
            json_text = match.group(0)
        else:
            raise ValueError("No JSON found in LLM response")
    return json.loads(json_text)

#---------------- Job formatting ----------------
def format_job_for_ui(job, idx):
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
        # Download PDF
        pdf = requests.get(req.cvUrl).content
        with tempfile.NamedTemporaryFile(delete=False, suffix=".pdf") as tmp:
            tmp.write(pdf)
            path = tmp.name

        text = extract_text_from_pdf(path)
        os.unlink(path)
        text = text[:4000]

        # Step 1: Analyze CV in English
        analysis_prompt = f"""
You are a professional CV reviewer.

Analyze the following CV and return STRICT JSON in this format:

{{
"strengths": [],
"weaknesses": [],
"improvements": [],
"atsCompatibility": 0,
"impact": 0,
"readability": 0,
"score": 0
}}

All scores should be from 0 to 100.

CV:
{text}
"""
        raw_response = ask_llm(analysis_prompt)
        print("Raw analysis response:", raw_response)

        # Extract JSON from any surrounding text/code fences
        json_match = re.search(r"```json\s*(\{.*?\})\s*```", raw_response, re.DOTALL)
        if json_match:
            json_text = json_match.group(1)
        else:
            # fallback: try to extract first {...} block
            json_match = re.search(r"(\{.*\})", raw_response, re.DOTALL)
            json_text = json_match.group(1) if json_match else "{}"

        # Parse JSON safely
        try:
            data = json.loads(json_text)
        except Exception as e:
            print("JSON parse failed:", e)
            data = {
                "strengths": [],
                "weaknesses": [],
                "improvements": [],
                "atsCompatibility": 75,
                "impact": 75,
                "readability": 75,
                "score": 75,
            }

        # Ensure all scores are percentages 0-100
        for key in ["atsCompatibility", "impact", "readability", "score"]:
            value = data.get(key, 75)
            if value <= 1:  # if model returns 0-1 scale
                value = int(value * 100)
            data[key] = min(max(int(value), 0), 100)

        # Step 2: Translate to Romanian readable format
        translate_prompt = f"""
Translate the following CV analysis into Romanian in a readable way.

Include sections:

Puncte forte:
- ...

Puncte slabe:
- ...

Sugestii de îmbunătățire:
- ...

Include also ATS score, Impact, Readability, and Overall Score as percentages.

Analysis JSON:
{json.dumps(data)}
"""
        romanian_text = ask_llm(translate_prompt)

        # Return recommendations + numeric scores
        return {
            "recommendations": romanian_text,
            "atsCompatibility": data["atsCompatibility"],
            "impact": data["impact"],
            "readability": data["readability"],
            "score": data["score"],
            "strengths": data.get("strengths", []),
            "weaknesses": data.get("weaknesses", []),
            "suggestions": data.get("improvements", [])
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