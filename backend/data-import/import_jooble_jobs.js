require("dotenv").config({ path: "../.env" });
const fs = require("fs");
const path = require("path");
const oracledb = require("oracledb");
const { initialize, executeQuery } = require("../db");

// citește JSON
const jobs = JSON.parse(
  fs.readFileSync(
    path.join(__dirname, "../data-fetch/jooble_jobs_ro.json"),
    "utf-8",
  ),
);

// 🔥 MAPARE DOMENII (FIX după ID-urile tale)
function detectDomainId(title) {
  const t = title.toLowerCase();
  if (t.match(/developer|software|it|cyber|frontend|backend|programator/))
    return 1;
  if (t.match(/finance|account|contabil|bank|audit/)) return 2;
  if (t.match(/marketing|seo|ads|pr/)) return 3;
  if (t.match(/engineer|inginer/)) return 4;
  if (t.match(/doctor|medical|nurse|farmacist/)) return 5;
  if (t.match(/teacher|profesor|educatie/)) return 6;
  if (t.match(/construct|electrician|instalator/)) return 7;
  if (t.match(/hotel|turism|receptioner/)) return 8;
  if (t.match(/hr|recruiter|resurse umane/)) return 9;
  if (t.match(/sales|vanzari|casier/)) return 10;
  return 1; // fallback IT
}

// mapare tip job
function mapJobType(type) {
  if (!type) return "Full-Time";
  const t = type.toLowerCase();
  if (t.includes("full")) return "Full-Time";
  if (t.includes("part")) return "Part-Time";
  if (t.includes("remote")) return "Remote";
  if (t.includes("intern")) return "Internship";
  return "Full-Time";
}

// formatează timestamp-ul ca să fie compatibil Oracle TO_TIMESTAMP
function formatTimestamp(ts) {
  const d = new Date(ts);
  const yyyy = d.getUTCFullYear();
  const mm = String(d.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(d.getUTCDate()).padStart(2, "0");
  const hh = String(d.getUTCHours()).padStart(2, "0");
  const mi = String(d.getUTCMinutes()).padStart(2, "0");
  const ss = String(d.getUTCSeconds()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}T${hh}:${mi}:${ss}`;
}

async function importJobs() {
  await initialize();

  console.log("🧹 Cleaning old Jooble data...");

// 🔴 DELETE CHILD TABLE FIRST (safe even if empty)
await executeQuery(
  `DELETE FROM Job_Limba_Straina
   WHERE id_job IN (
     SELECT id_job FROM Job 
     WHERE link_extern LIKE 'https://jooble.org/%'
   )`,
  {},
  { autoCommit: true },
);

// 🔴 DELETE JOOBLE JOBS
await executeQuery(
  `DELETE FROM Job 
   WHERE link_extern LIKE 'https://jooble.org/%'`,
  {},
  { autoCommit: true },
);

console.log("✅ Old Jooble jobs deleted");

  for (const job of jobs) {
    try {
      // 🔎 verifică dacă jobul există
      const existingJob = await executeQuery(
        `SELECT id_job FROM Job WHERE link_extern = :link`,
        { link: job.link },
      );

      if (existingJob.length > 0) {
        console.log("⏩ Job deja existent:", job.title);
        continue;
      }

      // 🏢 companie
      const compResult = await executeQuery(
        `SELECT id_companie FROM Companie WHERE denumire_companie = :name`,
        { name: job.company },
      );

      let id_companie;

      if (compResult.length === 0) {
        const insertComp = await executeQuery(
          `INSERT INTO Companie (id_companie, denumire_companie)
           VALUES (seq_companie.NEXTVAL, :name)
           RETURNING id_companie INTO :id`,
          {
            name: job.company,
            id: { dir: oracledb.BIND_OUT, type: oracledb.NUMBER },
          },
          { autoCommit: true },
        );

        id_companie = insertComp.outBinds.id[0];
      } else {
        id_companie = compResult[0].ID_COMPANIE;
      }

      // 🧠 domeniu
      const id_domeniu = detectDomainId(job.title);

      // 💾 inserare job
      await executeQuery(
        `INSERT INTO Job (
            id_job,
            titlu,
            descriere,
            link_extern,
            data_postarii,
            id_companie,
            id_domeniu,
            tip_job
        ) VALUES (
            seq_job.NEXTVAL,
            :title,
            :descriere,
            :link,
            TO_TIMESTAMP(:updated, 'YYYY-MM-DD"T"HH24:MI:SS'),
            :id_companie,
            :id_domeniu,
            :tip_job
        )`,
        {
          title: job.title,
          descriere: job.snippet,
          link: job.link,
          updated: formatTimestamp(job.updated),
          id_companie,
          id_domeniu,
          tip_job: mapJobType(job.type),
        },
        { autoCommit: true },
      );

      console.log("✅ Adăugat:", job.title);
    } catch (err) {
      console.error("❌ Eroare la job:", job.title, err.message);
    }
  }

  console.log("🎉 Import finalizat!");
}

importJobs();
