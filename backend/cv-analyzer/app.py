from fastapi import FastAPI, Request
from pydantic import BaseModel
import requests, tempfile, os
import pdfplumber
import spacy
from dotenv import load_dotenv
import cx_Oracle

load_dotenv()

app = FastAPI()

# Load spaCy once
nlp = spacy.load("en_core_web_sm")

# Oracle connection config
ORACLE_USER = os.getenv("DB_USER")
ORACLE_PASSWORD = os.getenv("DB_PASSWORD")
ORACLE_DSN = os.getenv("DB_CONNECT_STRING")
INSTANT_CLIENT_LIB_DIR = os.getenv("INSTANT_CLIENT_LIB_DIR")

if INSTANT_CLIENT_LIB_DIR:
    cx_Oracle.init_oracle_client(lib_dir=INSTANT_CLIENT_LIB_DIR)

def get_oracle_connection():
    return cx_Oracle.connect(user=ORACLE_USER, password=ORACLE_PASSWORD, dsn=ORACLE_DSN)

class CVRequest(BaseModel):
    cvUrl: str

# ---------- Helper functions ----------
def extract_text_from_pdf(path):
    text = ""
    with pdfplumber.open(path) as pdf:
        for page in pdf.pages:
            page_text = page.extract_text()
            if page_text:
                text += page_text + "\n"
    return text

def parse_resume(text):
    doc = nlp(text)
    # naive extraction of skills (customize as needed)
    skills = [token.text for token in doc if token.pos_ == "NOUN"]
    # naive extraction of organizations as work experience
    experience = [ent.text for ent in doc.ents if ent.label_ == "ORG"]
    # naive extraction of education as ORG with "University"/"College"
    education = [ent.text for ent in doc.ents if "University" in ent.text or "College" in ent.text]

    return {
        "skills": skills,
        "experience": experience,
        "education": education,
        "text": text
    }

# ---------- Endpoints ----------
@app.post("/analyze")
def analyze_cv(req: CVRequest):
    # Download PDF
    response = requests.get(req.cvUrl)
    if response.status_code != 200:
        return {"error": "Nu am putut descărca fișierul PDF"}

    # Save temporarily
    with tempfile.NamedTemporaryFile(delete=False, suffix=".pdf") as tmp:
        tmp.write(response.content)
        tmp_path = tmp.name

    try:
        text = extract_text_from_pdf(tmp_path)
        data = parse_resume(text)
    except Exception as e:
        os.unlink(tmp_path)
        return {"error": f"Eroare la analiză: {str(e)}"}
    finally:
        os.unlink(tmp_path)

    recomandari = []

    if not data.get("skills"):
        recomandari.append("Nu au fost detectate skill-uri. Asigură-te că le menționezi clar în CV.")
    if not data.get("experience"):
        recomandari.append("Include detalii despre experiența profesională, roluri și realizări concrete.")
    if not data.get("education"):
        recomandari.append("Adaugă secțiune de Educație, cu diplome și instituții.")

    text_length = len(data["text"].split())
    if text_length < 300:
        recomandari.append("CV-ul pare scurt. Detaliază experiența și skill-urile pentru a fi mai complet.")

    if not recomandari:
        recomandari.append("CV-ul tău arată bine conform analizei AI curente!")

    return {"recommendations": "\n".join(recomandari)}

@app.post("/suggestions")
async def suggestions(request: Request):
    data = await request.json()
    cv_url = data.get("cvUrl")
    if not cv_url:
        return {"error": "cvUrl missing"}

    # Step 1️⃣ Download and extract text from CV
    try:
        response = requests.get(cv_url)
        if response.status_code != 200:
            return {"error": "Nu am putut descărca fișierul PDF"}

        with tempfile.NamedTemporaryFile(delete=False, suffix=".pdf") as tmp:
            tmp.write(response.content)
            tmp_path = tmp.name

        text = extract_text_from_pdf(tmp_path)
        resume_data = parse_resume(text)
    except Exception as e:
        return {"error": f"Eroare la analiza CV-ului: {str(e)}"}
    finally:
        if os.path.exists(tmp_path):
            os.unlink(tmp_path)

    # Step 2️⃣ Extract skills for filtering
    cv_skills = [skill.lower() for skill in resume_data.get("skills", [])]

    # Step 3️⃣ Fetch jobs from Oracle
    try:
        conn = get_oracle_connection()
        cursor = conn.cursor()
        cursor.execute("""
            SELECT j.id_job, j.titlu, j.data_postarii, j.tip_job, j.nivel_experienta,
                   c.id_companie, c.denumire_companie, c.logo,
                   o.denumire_oras AS locatie, d.denumire_domeniu AS domeniu
            FROM job j
            LEFT JOIN companie c ON j.id_companie = c.id_companie
            LEFT JOIN centrucompanie cc ON cc.id_companie = c.id_companie
            LEFT JOIN oras o ON cc.id_oras = o.id_oras
            LEFT JOIN domeniu d ON j.id_domeniu = d.id_domeniu
        """)
        columns = [col[0] for col in cursor.description]
        all_jobs = [dict(zip(columns, row)) for row in cursor.fetchall()]
    except Exception as e:
        return {"error": f"Eroare la preluarea joburilor: {str(e)}"}
    finally:
        cursor.close()
        conn.close()

    # Step 4️⃣ Filter jobs based on CV skills (simple match)
    filtered_jobs = []
    for job in all_jobs:
        job_text = " ".join([
            str(job.get("TITLU", "")),
            str(job.get("DOMENIU", "")),
            str(job.get("DENUMIRE_COMPANIE", ""))
        ]).lower()

        # Keep the job if any CV skill is found in the job text
        if any(skill in job_text for skill in cv_skills):
            filtered_jobs.append(job)

    return {"jobs": filtered_jobs}

