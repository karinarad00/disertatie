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


def search_jobs(cv_text: str, top_k=5):
    index = faiss.read_index(INDEX_PATH)

    with open(META_PATH, encoding="utf-8") as f:
        jobs = json.load(f)

    cv_vector = embed(cv_text).reshape(1, -1)
    D, I = index.search(cv_vector, top_k)

    return [jobs[i] for i in I[0]]