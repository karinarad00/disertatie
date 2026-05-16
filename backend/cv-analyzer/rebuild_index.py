import json
from embeddings import build_job_index

with open("faiss_index/jobs_meta.json", "r", encoding="utf-8") as f:
    jobs = json.load(f)

print(f"Rebuilding index for {len(jobs)} jobs...")
build_job_index(jobs)
print("Index rebuilt successfully.")
