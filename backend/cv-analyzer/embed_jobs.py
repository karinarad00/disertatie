from oracle_jobs import get_jobs
from embeddings import build_job_index

if __name__ == "__main__":
    jobs = get_jobs()
    build_job_index(jobs)
    print(f"Embedded {len(jobs)} jobs successfully.")
