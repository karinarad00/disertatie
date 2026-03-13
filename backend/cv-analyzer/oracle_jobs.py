import oracledb
import os
from dotenv import load_dotenv

load_dotenv()

# Initialize Oracle Instant Client (only once)
instant_client = os.getenv("INSTANT_CLIENT_LIB_DIR")
if instant_client:
    oracledb.init_oracle_client(lib_dir=instant_client)


def get_connection():
    # Noua versiune oracledb nu mai acceptă encoding
    return oracledb.connect(
        user=os.getenv("DB_USER"),
        password=os.getenv("DB_PASSWORD"),
        dsn=os.getenv("DB_CONNECT_STRING")
    )


def get_jobs():
    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute("""
        SELECT j.id_job, j.titlu, j.tip_job, j.nivel_experienta,
               d.denumire_domeniu, o.denumire_oras
        FROM job j
        LEFT JOIN domeniu d ON j.id_domeniu = d.id_domeniu
        LEFT JOIN centrucompanie cc ON cc.id_companie = j.id_companie
        LEFT JOIN oras o ON o.id_oras = cc.id_oras
    """)

    jobs = []
    for row in cursor:
        jobs.append({
            "id": row[0],
            "text": f"{row[1]}, {row[2]}, {row[3]}, {row[4]}, {row[5]}"
        })

    cursor.close()
    conn.close()

    return jobs