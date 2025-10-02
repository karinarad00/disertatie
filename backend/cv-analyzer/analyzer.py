from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity

# Dummy jobs, tu poți lega aici Oracle DB
jobs = [
    {"title": "Frontend Developer", "description": "React, JavaScript, HTML, CSS"},
    {"title": "Backend Developer", "description": "Node.js, Databases, APIs"},
    {"title": "Data Analyst", "description": "Python, SQL, Pandas, Excel"}
]

def analyze_resume(cv_text: str):
    recs = []
    if len(cv_text.split()) < 150:
        recs.append("CV-ul este prea scurt, adaugă mai multe detalii.")
    if "email" not in cv_text.lower():
        recs.append("Adaugă o adresă de email.")
    if "project" not in cv_text.lower():
        recs.append("Include proiecte relevante.")

    return recs if recs else ["CV-ul tău arată bine!"]

def suggest_jobs(cv_text: str):
    corpus = [cv_text] + [job["description"] for job in jobs]
    vectorizer = TfidfVectorizer()
    vectors = vectorizer.fit_transform(corpus)
    sims = cosine_similarity(vectors[0:1], vectors[1:]).flatten()

    ranked = sorted(
        [{"title": jobs[i]["title"], "score": float(sims[i])} for i in range(len(jobs))],
        key=lambda x: x["score"], reverse=True
    )
    return ranked[:3]
