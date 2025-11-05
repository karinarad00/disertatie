from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import requests, tempfile, os, json
import pdfplumber
import spacy
from dotenv import load_dotenv
import cx_Oracle
import subprocess

# Load environment variables from .env
load_dotenv()

app = FastAPI()

# ---------------- CORS setup ----------------
origins = [
    "http://localhost:3000",  
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Load spaCy once
nlp = spacy.load("en_core_web_sm")

# Oracle connection config
ORACLE_USER = os.getenv("DB_USER")
ORACLE_PASSWORD = os.getenv("DB_PASSWORD")
ORACLE_DSN = os.getenv("DB_CONNECT_STRING")
INSTANT_CLIENT_LIB_DIR = os.getenv("INSTANT_CLIENT_LIB_DIR")

if INSTANT_CLIENT_LIB_DIR:
    cx_Oracle.init_oracle_client(lib_dir=INSTANT_CLIENT_LIB_DIR)

# Ollama path from environment (.env)
OLLAMA_PATH = os.getenv("OLLAMA_PATH")

def get_oracle_connection():
    return cx_Oracle.connect(user=ORACLE_USER, password=ORACLE_PASSWORD, dsn=ORACLE_DSN)


def ollama_chat(prompt: str, model: str = "phi3") -> str:
    """
    Runs a local Ollama model and returns the model response text.
    Requires Ollama to be installed and model pulled (e.g. `ollama pull phi3`).
    """
    result = subprocess.run(
        [OLLAMA_PATH, "run", model],
        input=prompt.encode("utf-8"),
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
    )
    output = result.stdout.decode("utf-8").strip()
    return output


class CVRequest(BaseModel):
    cvUrl: str


def extract_text_from_pdf(path):
    text = ""
    with pdfplumber.open(path) as pdf:
        for page in pdf.pages:
            page_text = page.extract_text()
            if page_text:
                text += page_text + "\n"
    return text


# ---------- /analyze (AI improvement suggestions) ----------
@app.post("/analyze")
def analyze_cv(req: CVRequest):
    response = requests.get(req.cvUrl)
    if response.status_code != 200:
        return {"error": "Nu am putut descărca fișierul PDF"}

    with tempfile.NamedTemporaryFile(delete=False, suffix=".pdf") as tmp:
        tmp.write(response.content)
        tmp_path = tmp.name

    try:
        text = extract_text_from_pdf(tmp_path)
    except Exception as e:
        os.unlink(tmp_path)
        return {"error": f"Eroare la analiză: {str(e)}"}
    finally:
        os.unlink(tmp_path)

    prompt = f"""
    Analizează următorul CV și oferă sugestii clare pentru îmbunătățire.
    Structura răspunsului:
    - Puncte tari
    - Puncte slabe
    - Sugestii concrete de îmbunătățire

    CV:
    {text}
    """

    ai_response = ollama_chat(prompt)

    return {"recommendations": ai_response}


# ---------- /suggestions (AI + Oracle job match) ----------
@app.post("/suggestions")
async def suggestions(request: Request):
    data = await request.json()
    cv_url = data.get("cvUrl")
    if not cv_url:
        return {"error": "cvUrl missing"}

    try:
        response = requests.get(cv_url)
        if response.status_code != 200:
            return {"error": "Nu am putut descărca fișierul PDF"}

        with tempfile.NamedTemporaryFile(delete=False, suffix=".pdf") as tmp:
            tmp.write(response.content)
            tmp_path = tmp.name

        text = extract_text_from_pdf(tmp_path)
    except Exception as e:
        return {"error": f"Eroare la analiza CV-ului: {str(e)}"}
    finally:
        if os.path.exists(tmp_path):
            os.unlink(tmp_path)

    # Connect to Oracle and fetch jobs
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

    job_data_text = "\n".join([
        f"- {j['TITLU']} la {j['DENUMIRE_COMPANIE']} ({j['DOMENIU']}, {j['LOCATIE']})"
        for j in all_jobs
    ])

    prompt = f"""
    Ai mai jos conținutul unui CV și o listă de joburi din baza de date.
    Alege cele mai potrivite 5 joburi pentru acest candidat și explică pe scurt de ce.

    CV:
    {text}

    Lista joburi:
    {job_data_text}
    """

    ai_response = ollama_chat(prompt)

    return {"ai_job_recommendations": ai_response}
