require("dotenv").config({ path: "../.env" });
const fs = require("fs");
const path = require("path");
const oracledb = require("oracledb");
const { initialize, executeQuery } = require("../db");

// 📄 Load JSON
const jobs = JSON.parse(
  fs.readFileSync(
    path.join(__dirname, "../data-fetch/jobs_bestjobs.json"),
    "utf-8",
  ),
);

// 🔥 DOMAIN DETECTION
function detectDomainId(text) {
  if (!text) return null;
  const t = text.toLowerCase();

  if (t.includes("finance") || t.includes("account")) return 2;
  if (t.includes("engineering") || t.includes("inginer")) return 4;
  if (t.includes("medical") || t.includes("doctor")) return 5;
  if (t.includes("education") || t.includes("teacher")) return 6;
  if (t.includes("construction") || t.includes("construct")) return 7;
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

// 🧩 JOB TYPE MAPPING
function mapJobType(type) {
  if (!type) return "Full-Time";

  const t = type.toLowerCase();

  if (t.includes("full")) return "Full-Time";
  if (t.includes("part")) return "Part-Time";
  if (t.includes("remote")) return "Remote";
  if (t.includes("intern")) return "Internship";
  if (t.includes("hybrid")) return "Hybrid";

  return "Full-Time";
}

// 🧠 EXPERIENCE LEVEL MAPPING (FIXED)
function mapExperienceLevel(levels, title) {
  const t = (title || "").toLowerCase();

  // 🔎 1. Detectare din TITLU
  if (t.includes("intern")) return "Internship";

  if (t.includes("junior") || t.includes("entry")) return "Junior";

  if (t.includes("mid") || t.includes("middle")) return "Mid-Level";

  if (t.includes("senior")) return "Senior";

  if (t.includes("lead") || t.includes("manager") || t.includes("director")) {
    return "Senior";
  }

  // 🔎 2. Din array (fallback)
  if (Array.isArray(levels) && levels.length > 0) {
    const last = levels[levels.length - 1].toLowerCase();

    if (last.includes("intern")) return "Internship";
    if (last.includes("entry")) return "Junior";
    if (last.includes("middle")) return "Mid-Level";
    if (last.includes("senior")) return "Senior";
    if (last.includes("executive")) return "Senior";
  }

  // 🔁 fallback safe
  return "Mid-Level";
}

// 🕒 FORMAT TIMESTAMP
function formatTimestamp(ts) {
  if (!ts) return null;

  const d = new Date(ts);

  const yyyy = d.getUTCFullYear();
  const mm = String(d.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(d.getUTCDate()).padStart(2, "0");
  const hh = String(d.getUTCHours()).padStart(2, "0");
  const mi = String(d.getUTCMinutes()).padStart(2, "0");
  const ss = String(d.getUTCSeconds()).padStart(2, "0");

  return `${yyyy}-${mm}-${dd}T${hh}:${mi}:${ss}`;
}

// 🚀 MAIN IMPORT
async function importJobs() {
  await initialize();

  try {
    console.log("🧹 Cleaning old BestJobs data...");

    // 🔴 DELETE CHILD TABLE FIRST
    await executeQuery(
      `DELETE FROM Job_Limba_Straina
       WHERE id_job IN (
         SELECT id_job FROM Job 
         WHERE link_extern LIKE 'https://www.bestjobs.eu/loc-de-munca/%'
       )`,
      {},
      { autoCommit: true },
    );

    // 🔴 DELETE JOBS
    await executeQuery(
      `DELETE FROM Job 
       WHERE link_extern LIKE 'https://www.bestjobs.eu/loc-de-munca/%'`,
      {},
      { autoCommit: true },
    );

    console.log("✅ Old BestJobs jobs deleted");

    // -------------------------
    // IMPORT LOOP
    // -------------------------
    for (const job of jobs) {
      try {
        // 🏢 COMPANY
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

        // 🧠 DOMAIN
        const id_domeniu = detectDomainId(
          `${job.TITLU || ""} ${job.DESCRIERE || ""}`,
        );

        // 💰 SALARY
        const salariu_min = job.SALARIU_MIN || null;
        const salariu_max = job.SALARIU_MAX || null;

        // 🎯 EXPERIENCE LEVEL (FIX)
        const nivel_experienta = mapExperienceLevel(
          job.NIVEL_EXPERIENTA,
          job.TITLU,
        );

        // 💾 INSERT JOB
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
            updated:
              formatTimestamp(job.DATA_POSTARII) || formatTimestamp(Date.now()),
            id_companie,
            id_domeniu,
            tip_job: mapJobType(job.TIP_JOB),
            nivel: nivel_experienta,
            sal_min: salariu_min,
            sal_max: salariu_max,
            id: { dir: oracledb.BIND_OUT, type: oracledb.NUMBER },
          },
          { autoCommit: true },
        );

        const id_job = insertJob.outBinds.id[0];

        // 🌐 LANGUAGES
        if (Array.isArray(job.LIMBI)) {
          for (const l of job.LIMBI) {
            let limbaResult = await executeQuery(
              `SELECT id_limba FROM Limba_Straina WHERE denumire_limba = :name`,
              { name: l.limba },
            );

            let id_limba;

            if (limbaResult.length === 0) {
              const insertLimba = await executeQuery(
                `INSERT INTO Limba_Straina (id_limba, denumire_limba)
                 VALUES (seq_limba.NEXTVAL, :name)
                 RETURNING id_limba INTO :id`,
                {
                  name: l.limba,
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
                nivel: l.nivel,
              },
              { autoCommit: true },
            );
          }
        }

        console.log("✅ Adăugat:", job.TITLU, "| Nivel:", nivel_experienta);
      } catch (err) {
        console.error("❌ Eroare job:", job.TITLU, err.message);
      }
    }

    console.log("🎉 Import finalizat!");
  } catch (err) {
    console.error("❌ Eroare generală:", err.message);
  }
}

importJobs();
