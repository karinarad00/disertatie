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
    match = re.search(r'```json(.*?)```', response, re.DOTALL)
    if match:
        json_text = match.group(1).strip()
    else:
        match = re.search(r'\{.*\}', response, re.DOTALL)
        if match:
            json_text = match.group(0)
        else:
            raise ValueError("No JSON found in LLM response")
    return json.loads(json_text)

# ---------------- Job formatting ----------------
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
        "matchScore": job.get("matchScore") or 0
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
        text = text[:4000]

        analysis_prompt = f"""
You are a professional CV reviewer.

Analyze the following CV and return STRICT JSON:

{{
"strengths": [],
"weaknesses": [],
"improvements": [],
"atsCompatibility": 0,
"impact": 0,
"readability": 0,
"score": 0
}}

CV:
{text}
"""
        raw_response = ask_llm(analysis_prompt)

        try:
            data = parse_llm_json(raw_response)
        except Exception:
            data = {
                "strengths": [],
                "weaknesses": [],
                "improvements": [],
                "atsCompatibility": 75,
                "impact": 75,
                "readability": 75,
                "score": 75
            }

        for key in ["atsCompatibility", "impact", "readability", "score"]:
            value = data.get(key, 75)
            if value <= 1:
                value = int(value * 100)
            data[key] = min(max(int(value), 0), 100)

        translate_prompt = f"""
Translate the following CV analysis into Romanian:

Analysis JSON:
{json.dumps(data)}
"""
        romanian_text = ask_llm(translate_prompt)

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

# ---------------- JOB MATCHING cu matchScore LLM ----------------
@app.post("/suggestions")
def job_suggestions(req: CVRequest):
    try:
        # Download CV PDF
        pdf = requests.get(req.cvUrl).content
        with tempfile.NamedTemporaryFile(delete=False, suffix=".pdf") as tmp:
            tmp.write(pdf)
            path = tmp.name

        cv_text = extract_text_from_pdf(path)[:4000]
        os.unlink(path)

        top_k=10
        # FAISS search - deja sortează descrescător după relevanță
        top_jobs = search_jobs(cv_text, top_k=top_k)
        jobs_with_scores = []

        for idx, job in enumerate(top_jobs):
            job_copy = job.copy()

            # LLM matchScore
            if idx < top_k:
                job_desc = job.get("DESCRIERE") or job.get("description") or ""
                llm_prompt = f"""
Ești un expert HR. Returnează STRICT JSON:

{{
"matchScore": 0   # procent 0-100
}}

Job description:
{job_desc}

Candidate CV:
{cv_text}
"""
                try:
                    llm_response = ask_llm(llm_prompt)
                    llm_data = parse_llm_json(llm_response)
                    match_score = int(min(max(llm_data.get("matchScore", 0), 0), 100))
                except Exception:
                    match_score = 0
            else:
                match_score = 0

            job_copy["matchScore"] = match_score
            jobs_with_scores.append(job_copy)

        # Formatează pentru UI
        formatted_jobs = [format_job_for_ui(job, idx) for idx, job in enumerate(jobs_with_scores)]

        return {
            "jobs": formatted_jobs,
            "explanation": "Joburile sunt ordonate descrescător după relevanță, matchScore calculat de LLM pentru primele k joburi."
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
    cvUrls: List[str]

@app.post("/job-cv-match")
def job_cv_match(req: JobCVMatchRequest):
    try:
        index = faiss.read_index(INDEX_PATH)
        with open(META_PATH, encoding="utf-8") as f:
            jobs_meta = json.load(f)

        job_meta = next((j for j in jobs_meta if j.get("id") == req.jobId or j.get("id_job") == req.jobId), None)
        if not job_meta:
            raise HTTPException(status_code=404, detail="Job not found")

        job_text = job_meta["text"]
        job_vector = embed(job_text).reshape(1, -1)

        results = []
        for cv_url in req.cvUrls:
            pdf = requests.get(cv_url).content
            with tempfile.NamedTemporaryFile(delete=False, suffix=".pdf") as tmp:
                tmp.write(pdf)
                path = tmp.name

            cv_text = extract_text_from_pdf(path)[:4000]
            os.unlink(path)

            cv_vector = embed(cv_text).reshape(1, -1)
            similarity = float(np.dot(job_vector, cv_vector.T) / 
                               (np.linalg.norm(job_vector) * np.linalg.norm(cv_vector)))
            score = round(similarity * 100, 2)

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

        results = sorted(results, key=lambda x: x["fitScore"], reverse=True)
        return {
            "job": job_meta,
            "rankedCandidates": results
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))