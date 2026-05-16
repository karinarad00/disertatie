import os
import json
import faiss
import numpy as np
from sentence_transformers import SentenceTransformer

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
INDEX_PATH = os.path.join(BASE_DIR, "faiss_index/jobs.index")
META_PATH = os.path.join(BASE_DIR, "faiss_index/jobs_meta.json")

model = SentenceTransformer("paraphrase-multilingual-MiniLM-L12-v2")


def embed(text: str):
    vector = model.encode(text)
    # Normalize for cosine similarity
    vector = vector / np.linalg.norm(vector)
    return np.array(vector, dtype="float32")


def build_job_index(jobs: list):
    vectors = [embed(j["text"]) for j in jobs]
    vectors = np.stack(vectors)

    dim = vectors.shape[1]
    # Use Inner Product (IP) for Cosine Similarity since vectors are normalized
    index = faiss.IndexFlatIP(dim)
    index.add(vectors)

    os.makedirs("faiss_index", exist_ok=True)
    faiss.write_index(index, INDEX_PATH)

    with open(META_PATH, "w", encoding="utf-8") as f:
        json.dump(jobs, f, ensure_ascii=False)


def search_jobs(cv_text: str, top_k=None):
    """
    Caută joburi relevante pentru textul CV-ului folosind similaritatea cosinus.
    """
    index = faiss.read_index(INDEX_PATH)

    with open(META_PATH, encoding="utf-8") as f:
        jobs = json.load(f)

    cv_vector = embed(cv_text).reshape(1, -1)

    if top_k is None or top_k > len(jobs):
        top_k = len(jobs)

    # For IP, higher similarity is better
    D, I = index.search(cv_vector, top_k)

    results = []
    for i, similarity in zip(I[0], D[0]):
        job = jobs[i].copy()
        # Similarity is already the dot product, capped between 0 and 1
        job["score"] = float(max(0, similarity))
        results.append(job)
        
    return results