import re
import tempfile
import os
import requests
import json
from typing import List

import numpy as np
import faiss
from pydantic import BaseModel
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
def ask_llm(prompt: str, system_message: str = "Ești un asistent util, expert în HR și recrutare."):
    chat = client.chat.completions.create(
        model=MODEL,
        messages=[
            {"role": "system", "content": system_message},
            {"role": "user", "content": prompt}
        ],
        temperature=0.3,
        response_format={"type": "json_object"} if "JSON" in prompt else None
    )
    return chat.choices[0].message.content

# ---------------- Helper: parse LLM JSON safely ----------------
def parse_llm_json(response: str):
    try:
        # Încearcă direct json.loads
        return json.loads(response)
    except json.JSONDecodeError:
        # Fallback la regex dacă LLM-ul a adăugat text extra
        match = re.search(r'\{.*\}', response, re.DOTALL)
        if match:
            return json.loads(match.group(0))
        raise ValueError("No JSON found in LLM response")

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
        print(f"DEBUG: Extracted CV text (first 500 chars): {text[:500]}")
        os.unlink(path)
        text = text[:6000] # Mărim limita de text pentru analiză mai bună

        analysis_prompt = f"""
Ești un expert în analiza de CV-uri. Analizează textul extras din CV și oferă feedback în LIMBA ROMÂNĂ.
Returnează un obiect JSON valid cu următoarea structură:

{{
  "strengths": ["punct tare 1", "punct tare 2"],
  "weaknesses": ["punct slab 1", "punct slab 2"],
  "improvements": ["sugestie de îmbunătățire 1", "sugestie 2"],
  "recommendations": "O concluzie scurtă și profesională despre profilul candidatului.",
  "atsCompatibility": 0, 
  "impact": 0, 
  "readability": 0, 
  "score": 0 
}}

Scorurile (atsCompatibility, impact, readability, score) trebuie să fie între 0 și 100.

CV Text:
{text}
"""
        raw_response = ask_llm(analysis_prompt, system_message="Ești un expert HR care returnează STRICT JSON.")

        try:
            data = parse_llm_json(raw_response)
        except Exception:
            data = {
                "strengths": [],
                "weaknesses": [],
                "improvements": [],
                "recommendations": "Eroare la procesarea analizei detaliate.",
                "atsCompatibility": 70,
                "impact": 70,
                "readability": 70,
                "score": 70
            }

        # Validare scoruri și calculare media ponderată
        ats = data.get("atsCompatibility", 70)
        impact = data.get("impact", 70)
        readability = data.get("readability", 70)

        def clean_score(val):
            try:
                if isinstance(val, str):
                    val = int(re.sub(r'[^0-9]', '', val))
                if val <= 1 and val > 0:
                    val = int(val * 100)
                return min(max(int(val), 0), 100)
            except:
                return 70

        ats = clean_score(ats)
        impact = clean_score(impact)
        readability = clean_score(readability)

        # Formula ponderată: ATS (40%) + Impact (35%) + Readability (25%)
        final_score = int((ats * 0.4) + (impact * 0.35) + (readability * 0.25))

        return {
            "recommendations": data.get("recommendations", ""),
            "atsCompatibility": ats,
            "impact": impact,
            "readability": readability,
            "score": final_score,
            "strengths": data.get("strengths", []),
            "weaknesses": data.get("weaknesses", []),
            "suggestions": data.get("improvements", [])
        }

    except Exception as e:
        print(f"Error in analyze_cv: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# ---------------- JOB MATCHING cu matchScore LLM ----------------
@app.post("/suggestions")
def job_suggestions(req: CVRequest):
    try:
        pdf = requests.get(req.cvUrl).content
        with tempfile.NamedTemporaryFile(delete=False, suffix=".pdf") as tmp:
            tmp.write(pdf)
            path = tmp.name

        cv_text = extract_text_from_pdf(path)[:4000]
        print(f"DEBUG: Extracted CV text (first 500 chars) in job_suggestions: {cv_text[:500]}")
        os.unlink(path)

        top_k = 10
        top_jobs = search_jobs(cv_text, top_k=top_k)
        jobs_with_scores = []

        for idx, job in enumerate(top_jobs):
            job_copy = job.copy()

            if idx < 5: # Calculăm matchScore detaliat doar pentru primele 5
                job_desc = job.get("DESCRIERE") or job.get("description") or ""
                llm_prompt = f"""
Evaluează potrivirea dintre acest CV și Job Description, indiferent de limbă (română/engleză).
Returnează un obiect JSON cu scorul de compatibilitate (matchScore) între 0 și 100.

{{
  "matchScore": 85
}}

Job: {job_desc[:1000]}
CV: {cv_text[:1000]}
"""
                try:
                    llm_response = ask_llm(llm_prompt, system_message="Ești un expert HR. Returnează STRICT JSON.")
                    llm_data = parse_llm_json(llm_response)
                    match_score = int(llm_data.get("matchScore", 0))
                except Exception:
                    match_score = int(job.get("score", 0) * 100) if job.get("score") else 50
            else:
                # Pentru restul, folosim scorul din FAISS convertit
                match_score = int(job.get("score", 0) * 100) if job.get("score") else 40

            job_copy["matchScore"] = min(max(match_score, 0), 100)
            if job_copy["matchScore"] > 0:
                jobs_with_scores.append(job_copy)

        formatted_jobs = [format_job_for_ui(job, idx) for idx, job in enumerate(jobs_with_scores)]
        return {
            "jobs": formatted_jobs,
            "explanation": "Joburile sunt ordonate după relevanță semantică și analiză AI."
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    
# ---------------- JOB-TO-CV MATCHING ----------------
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
        print(f"DEBUG: Job text length: {len(job_text)}")
        job_vector = embed(job_text).reshape(1, -1)
        print(f"DEBUG: Job vector norm: {np.linalg.norm(job_vector)}")

        results = []
        for cv_url in req.cvUrls:
            try:
                pdf = requests.get(cv_url).content
                with tempfile.NamedTemporaryFile(delete=False, suffix=".pdf") as tmp:
                    tmp.write(pdf)
                    path = tmp.name

                cv_text = extract_text_from_pdf(path)[:4000]
                print(f"DEBUG: CV text length: {len(cv_text)}")
                os.unlink(path)

                cv_vector = embed(cv_text).reshape(1, -1)
                print(f"DEBUG: CV vector norm: {np.linalg.norm(cv_vector)}")
                
                similarity = float(np.dot(job_vector, cv_vector.T) / 
                                (np.linalg.norm(job_vector) * np.linalg.norm(cv_vector)))
                print(f"DEBUG: Calculated similarity: {similarity}")
                score = round(similarity * 100, 2)

                analysis_prompt = f"""
Ești un recruiter expert. Analizează acest CV în raport cu jobul dat.
Extrage informațiile solicitate în LIMBA ROMÂNĂ și returnează un obiect JSON valid.

Job: {job_text[:500]}
CV: {cv_text[:2000]}

Structură JSON:
{{
  "explanation": "Explicație scurtă (max 3 fraze) despre potrivire.",
  "title": "Titlu profesional (ex: Software Engineer)",
  "location": "Oraș/Țară",
  "experience": "Ani de experiență (ex: 3 ani)",
  "skills": ["skill1", "skill2"],
  "summary": "Rezumat profil (max 2 fraze)",
  "phone": "Număr de telefon dacă există, altfel N/A"
}}
"""
                raw_response = ask_llm(analysis_prompt, system_message="Ești un recruiter expert care returnează STRICT JSON.")
                details = parse_llm_json(raw_response)

                results.append({
                    "cvUrl": cv_url,
                    "fitScore": score,
                    **details
                })
            except Exception as e:
                print(f"Error processing CV {cv_url}: {e}")

        results = sorted(results, key=lambda x: x["fitScore"], reverse=True)
        return {
            "job": job_meta,
            "rankedCandidates": results
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))