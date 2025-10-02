from fastapi import FastAPI, Request
from parser import extract_text_from_pdf
from analyzer import analyze_resume, suggest_jobs
from pydantic import BaseModel
import pdfplumber
import requests, tempfile

app = FastAPI()

class CVRequest(BaseModel):
    cvUrl: str

@app.post("/analyze")
def analyze_cv(req: CVRequest):
    # Descarcă PDF-ul din Oracle bucket
    response = requests.get(req.cvUrl)
    if response.status_code != 200:
        return {"error": "Nu am putut descărca fișierul PDF"}

    # Salvează temporar
    with open("temp.pdf", "wb") as f:
        f.write(response.content)

    # Extrage text
    text = ""
    with pdfplumber.open("temp.pdf") as pdf:
        for page in pdf.pages:
            text += page.extract_text() or ""

    # 🔹 Aici poți adăuga regulile/ML/NLP pentru analiză
    recomandari = []
    if "Photoshop" not in text:
        recomandari.append("Adaugă skill-uri de design grafic dacă sunt relevante.")
    if len(text.split()) < 300:
        recomandari.append("CV-ul tău pare scurt, încearcă să detaliezi experiența.")

    return {"recommendations": "\n".join(recomandari) or "Nu au fost găsite sugestii."}

@app.post("/suggestions")
async def suggestions(request: Request):
    data = await request.json()
    cv_url = data.get("cvUrl")
    if not cv_url:
        return {"error": "cvUrl missing"}

    pdf_data = requests.get(cv_url)
    with tempfile.NamedTemporaryFile(delete=False, suffix=".pdf") as tmp:
        tmp.write(pdf_data.content)
        tmp_path = tmp.name

    text = extract_text_from_pdf(tmp_path)
    return {"jobs": suggest_jobs(text)}
