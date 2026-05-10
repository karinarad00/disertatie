import oracledb
import os
from dotenv import load_dotenv

load_dotenv()

instant_client = os.getenv("INSTANT_CLIENT_LIB_DIR")
if instant_client:
    oracledb.init_oracle_client(lib_dir=instant_client)


def get_connection():
    return oracledb.connect(
        user=os.getenv("DB_USER"),
        password=os.getenv("DB_PASSWORD"),
        dsn=os.getenv("DB_CONNECT_STRING")
    )


def lob_to_str(lob):
    """Convert LOB to string safely."""
    if lob is None:
        return ""
    if hasattr(lob, "read"):
        return lob.read()
    return str(lob)


def get_jobs():
    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute("""
        SELECT j.id_job, j.titlu, j.tip_job, j.nivel_experienta,
               d.denumire_domeniu, o.denumire_oras, c.denumire_companie,
               j.descriere, j.data_postarii, c.logo
        FROM job j
        LEFT JOIN domeniu d ON j.id_domeniu = d.id_domeniu
        LEFT JOIN centrucompanie cc ON cc.id_companie = j.id_companie
        LEFT JOIN oras o ON o.id_oras = cc.id_oras
        LEFT JOIN companie c ON c.id_companie = j.id_companie
    """)

    jobs = []
    for row in cursor:
        descriere = lob_to_str(row[7])
        data_postarii = row[8].isoformat() if row[8] else None 
        jobs.append({
            "ID_JOB": row[0],
            "TITLU": row[1],
            "TIP_JOB": row[2],
            "NIVEL_EXPERIENTA": row[3],
            "DOMENIU": row[4],
            "LOCATIE": row[5],
            "DENUMIRE_COMPANIE": row[6],
            "DESCRIERE": descriere,
            "DATA_POSTARII": data_postarii,
            "LOGO": row[9],
            # Text for embedding
            "text": f"{row[1]}, {row[2]}, {row[3]}, {row[4]}, {row[5]}, {descriere}"
        })

    cursor.close()
    conn.close()
    return jobs