import os
import json
import faiss
import numpy as np
from sentence_transformers import SentenceTransformer

INDEX_PATH = "faiss_index/jobs.index"
META_PATH = "faiss_index/jobs_meta.json"

model = SentenceTransformer("all-MiniLM-L6-v2")


def embed(text: str):
    vector = model.encode(text)
    return np.array(vector, dtype="float32")


def build_job_index(jobs: list):
    vectors = [embed(j["text"]) for j in jobs]
    vectors = np.stack(vectors)

    dim = vectors.shape[1]
    index = faiss.IndexFlatL2(dim)
    index.add(vectors)

    os.makedirs("faiss_index", exist_ok=True)
    faiss.write_index(index, INDEX_PATH)

    with open(META_PATH, "w", encoding="utf-8") as f:
        json.dump(jobs, f, ensure_ascii=False)


def search_jobs(cv_text: str, top_k=None):
    """
    Caută joburi relevante pentru textul CV-ului.
    Dacă top_k=None, returnează TOATE joburile sortate după relevanță.
    """
    index = faiss.read_index(INDEX_PATH)

    with open(META_PATH, encoding="utf-8") as f:
        jobs = json.load(f)

    cv_vector = embed(cv_text).reshape(1, -1)

    # Dacă nu există top_k, returnează toate joburile
    if top_k is None or top_k > len(jobs):
        top_k = len(jobs)

    D, I = index.search(cv_vector, top_k)

    # Rezultatul sortat după relevanță
    return [jobs[i] for i in I[0]]