require("dotenv").config({ path: "../.env" });
const fs = require("fs");
const path = require("path");
const oracledb = require("oracledb");
const { initialize, executeQuery } = require("../db");

const jobs = JSON.parse(
  fs.readFileSync(
    path.join(__dirname, "../data-fetch/jobs_ejobs.json"),
    "utf-8",
  ),
);

// -------------------------
// DOMAIN DETECTION
// -------------------------
function detectDomainId(text) {
  if (!text) return null;
  const t = text.toLowerCase();

  if (t.includes("finance") || t.includes("account")) return 2;
  if (t.includes("engineering") || t.includes("inginer")) return 4;
  if (t.includes("medical") || t.includes("doctor")) return 5;
  if (t.includes("education") || t.includes("teacher")) return 6;
  if (t.includes("construction") || t.includes("instal")) return 7;
  if (t.includes("horeca") || t.includes("hotel") || t.includes("tourism"))
    return 8;
  if (t.includes("hr") || t.includes("recruiter")) return 9;
  if (t.includes("sales") || t.includes("vanzari")) return 10;
  if (t.includes("marketing") || t.includes("seo") || t.includes("ads"))
    return 3;
  if (t.includes("it") || t.includes("software") || t.includes("developer"))
    return 1;

  return null;
}

// -------------------------
// JOB TYPE SAFE MAP
// -------------------------
function mapJobType(type) {
  if (!type) return "Full-Time";

  const t = type.toLowerCase();

  if (t.includes("remote")) return "Remote";
  if (t.includes("part")) return "Part-Time";
  if (t.includes("intern")) return "Internship";

  return "Full-Time";
}

// -------------------------
// EXPERIENCE SAFE MAP (IMPORTANT)
// -------------------------
function mapExperience(exp) {
  if (!exp) return null;

  const t = Array.isArray(exp)
    ? exp.join(" ").toLowerCase()
    : exp.toLowerCase();

  if (t.includes("intern")) return "Internship";
  if (t.includes("junior") || t.includes("entry")) return "Junior";
  if (t.includes("mid")) return "Mid-Level";
  if (t.includes("senior")) return "Senior";

  return null; // evita CHK fail
}

// -------------------------
// TIMESTAMP
// -------------------------
function formatTimestamp(ts) {
  if (!ts) return null;

  const d = new Date(ts);

  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}-${String(
    d.getUTCDate(),
  ).padStart(2, "0")}T${String(d.getUTCHours()).padStart(2, "0")}:${String(
    d.getUTCMinutes(),
  ).padStart(2, "0")}:${String(d.getUTCSeconds()).padStart(2, "0")}`;
}

// -------------------------
// MAIN IMPORT
// -------------------------
async function importJobs() {
  await initialize();

  try {
    console.log("🧹 Cleaning old BestJobs data...");

    await executeQuery(
      `DELETE FROM Job_Limba_Straina
       WHERE id_job IN (
         SELECT id_job FROM Job 
         WHERE link_extern LIKE 'https://www.ejobs.ro/user/locuri-de-munca/%'
       )`,
      {},
      { autoCommit: true },
    );

    await executeQuery(
      `DELETE FROM Job 
       WHERE link_extern LIKE 'https://www.ejobs.ro/user/locuri-de-munca/%'`,
      {},
      { autoCommit: true },
    );

    console.log("✅ Old data cleaned");

    for (const job of jobs) {
      try {
        // COMPANY
        let compResult = await executeQuery(
          `SELECT id_companie FROM Companie WHERE denumire_companie = :name`,
          { name: job.COMPANIE },
        );

        let id_companie;

        if (compResult.length === 0) {
          const insertComp = await executeQuery(
            `INSERT INTO Companie (id_companie, denumire_companie)
             VALUES (seq_companie.NEXTVAL, :name)
             RETURNING id_companie INTO :id`,
            {
              name: job.COMPANIE,
              id: { dir: oracledb.BIND_OUT, type: oracledb.NUMBER },
            },
            { autoCommit: true },
          );

          id_companie = insertComp.outBinds.id[0];
        } else {
          id_companie = compResult[0].ID_COMPANIE;
        }

        // DOMAIN
        const id_domeniu = detectDomainId(
          `${job.TITLU || ""} ${job.DESCRIERE || ""}`,
        );

        // EXPERIENCE SAFE
        const nivel = mapExperience(job.NIVEL_EXPERIENTA);

        // JOB TYPE SAFE
        const tip_job = mapJobType(job.TIP_JOB);

        // SALARY SAFE (CHK fix)
        let salariu_min = job.SALARIU_MIN || null;
        let salariu_max = job.SALARIU_MAX || null;

        if (salariu_min && salariu_max && salariu_max < salariu_min) {
          salariu_max = null;
        }

        const insertJob = await executeQuery(
          `INSERT INTO Job (
            id_job, titlu, descriere, link_extern, data_postarii,
            id_companie, id_domeniu, tip_job, nivel_experienta,
            salariu_min, salariu_max
          ) VALUES (
            seq_job.NEXTVAL, :title, :descriere, :link,
            TO_TIMESTAMP(:updated, 'YYYY-MM-DD"T"HH24:MI:SS'),
            :id_companie, :id_domeniu, :tip_job, :nivel,
            :sal_min, :sal_max
          )
          RETURNING id_job INTO :id`,
          {
            title: job.TITLU,
            descriere: job.DESCRIERE,
            link: job.LINK_EXTERN,
            updated: formatTimestamp(Date.now()),
            id_companie,
            id_domeniu,
            tip_job,
            nivel,
            sal_min: salariu_min,
            sal_max: salariu_max,
            id: { dir: oracledb.BIND_OUT, type: oracledb.NUMBER },
          },
          { autoCommit: true },
        );

        const id_job = insertJob.outBinds.id[0];

        // LANGUAGES
        if (Array.isArray(job.LIMBI)) {
          for (const l of job.LIMBI) {
            let limbaResult = await executeQuery(
              `SELECT id_limba FROM Limba_Straina WHERE denumire_limba = :name`,
              { name: l.limba || l },
            );

            let id_limba;

            if (limbaResult.length === 0) {
              const insertLimba = await executeQuery(
                `INSERT INTO Limba_Straina (id_limba, denumire_limba)
                 VALUES (seq_limba.NEXTVAL, :name)
                 RETURNING id_limba INTO :id`,
                {
                  name: l.limba || l,
                  id: { dir: oracledb.BIND_OUT, type: oracledb.NUMBER },
                },
                { autoCommit: true },
              );

              id_limba = insertLimba.outBinds.id[0];
            } else {
              id_limba = limbaResult[0].ID_LIMBA;
            }

            await executeQuery(
              `INSERT INTO Job_Limba_Straina (id_job, id_limba, nivel)
               VALUES (:id_job, :id_limba, :nivel)`,
              {
                id_job,
                id_limba,
                nivel: l.nivel || null,
              },
              { autoCommit: true },
            );
          }
        }

        console.log("✅ Inserted:", job.TITLU);
      } catch (err) {
        console.error("❌ Job error:", job.TITLU, err.message);
      }
    }

    console.log("🎉 Import finished!");
  } catch (err) {
    console.error("❌ Fatal error:", err.message);
  }
}

importJobs();
