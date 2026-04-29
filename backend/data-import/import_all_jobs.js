require("dotenv").config({ path: "../.env" });

const fs = require("fs");
const path = require("path");
const oracledb = require("oracledb");
const { initialize, executeQuery } = require("../db");

oracledb.fetchAsString = [oracledb.CLOB];

// =========================
// LOAD DATA
// =========================
const joobleJobs = JSON.parse(
  fs.readFileSync(
    path.join(__dirname, "../data-fetch/jooble_jobs_ro.json"),
    "utf-8",
  ),
);

const bestJobs = JSON.parse(
  fs.readFileSync(
    path.join(__dirname, "../data-fetch/jobs_bestjobs.json"),
    "utf-8",
  ),
);

const eJobs = JSON.parse(
  fs.readFileSync(
    path.join(__dirname, "../data-fetch/jobs_ejobs.json"),
    "utf-8",
  ),
);

// =========================
// HELPERS
// =========================
const safe = (v, f = "") => (v === null || v === undefined ? f : v.toString());

function randomPhone() {
  return "07" + Math.floor(10000000 + Math.random() * 89999999);
}

function randomEmail(name) {
  return name.toLowerCase().replace(/\s+/g, "") + "@company.ro";
}

function randomWebsite(name) {
  return "www." + name.toLowerCase().replace(/\s+/g, "") + ".ro";
}

// =========================
// DOMAIN
// =========================
function detectDomainId(text) {
  const t = (text || "").toLowerCase();

  if (t.match(/it|software|developer|programator|cyber/)) return 1;
  if (t.match(/finance|account|contabil/)) return 2;
  if (t.match(/marketing|seo|ads/)) return 3;
  if (t.match(/engineer|inginer/)) return 4;
  if (t.match(/medical|doctor|farmacist/)) return 5;
  if (t.match(/teacher|profesor/)) return 6;
  if (t.match(/construct|instalator/)) return 7;
  if (t.match(/hotel|horeca/)) return 8;
  if (t.match(/hr|recruiter/)) return 9;
  if (t.match(/sales|vanzari/)) return 10;

  return 1;
}

// =========================
// NORMALIZERS
// =========================
function mapJobType(val) {
  const t = (val || "").toLowerCase();

  if (t.includes("part")) return "Part-Time";
  if (t.includes("remote")) return "Remote";
  if (t.includes("intern")) return "Internship";

  return "Full-Time";
}

function mapExperience(val) {
  const t = (val || "").toLowerCase();

  if (t.includes("intern")) return "Internship";
  if (t.includes("junior") || t.includes("entry")) return "Junior";
  if (t.includes("senior") || t.includes("manager")) return "Senior";

  return "Mid-Level";
}

function mapLanguageLevel(level) {
  const l = (level || "").toLowerCase();

  if (l.includes("nativ")) return "nativ";
  if (l.includes("avansat")) return "avansat";
  if (l.includes("mediu")) return "mediu";

  return "mediu";
}

// =========================
// CLEAN DB
// =========================
async function cleanDatabase() {
  console.log("🧹 Cleaning DB...");

  // delete in correct FK order
  await executeQuery(`DELETE FROM Job_Limba_Straina`, [], { autoCommit: true });
  await executeQuery(`DELETE FROM Lista_Favorite`, [], { autoCommit: true });
  await executeQuery(`DELETE FROM Aplicare_Job`, [], { autoCommit: true });
  await executeQuery(`DELETE FROM Recenzie`, [], { autoCommit: true });
  await executeQuery(`DELETE FROM Job`, [], { autoCommit: true });
  await executeQuery(`DELETE FROM CentruCompanie`, [], { autoCommit: true });
  await executeQuery(`DELETE FROM Companie`, [], { autoCommit: true });

  console.log("🔁 Resetting sequences...");

  const sequences = ["seq_companie", "seq_job", "seq_limba"];

  for (const seq of sequences) {
    try {
      await executeQuery(`DROP SEQUENCE ${seq}`);
    } catch (e) {
      // ignore if doesn't exist
    }
  }

  // recreate sequences
  await executeQuery(
    `CREATE SEQUENCE seq_companie START WITH 1 INCREMENT BY 1 NOCACHE`,
  );
  await executeQuery(
    `CREATE SEQUENCE seq_job START WITH 1 INCREMENT BY 1 NOCACHE`,
  );
  await executeQuery(
    `CREATE SEQUENCE seq_limba START WITH 1 INCREMENT BY 1 NOCACHE`,
  );

  console.log("✅ Clean + sequences reset complete");
}

// =========================
// COMPANY
// =========================
async function getCompany(name) {
  const res = await executeQuery(
    `SELECT id_companie FROM Companie WHERE denumire_companie = :comp_name`,
    { comp_name: name },
  );

  if (res.length > 0) return res[0].ID_COMPANIE;

  const insert = await executeQuery(
    `INSERT INTO Companie (
      id_companie,
      denumire_companie,
      email,
      website,
      descriere,
      logo,
      telefon
    ) VALUES (
      seq_companie.NEXTVAL,
      :comp_name,
      :comp_email,
      :comp_web,
      :comp_desc,
      :comp_logo,
      :comp_phone
    )
    RETURNING id_companie INTO :comp_id`,
    {
      comp_name: name,
      comp_email: randomEmail(name),
      comp_web: randomWebsite(name),
      comp_desc: "Companie din Romania",
      comp_logo: "logo.png",
      comp_phone: randomPhone(),
      comp_id: { dir: oracledb.BIND_OUT, type: oracledb.NUMBER },
    },
    { autoCommit: true },
  );

  return insert.outBinds.comp_id[0];
}

// =========================
// ORAS + CENTRU
// =========================
async function linkCompanyToCity(companyId, cities) {
  if (!Array.isArray(cities)) return;

  for (const city of cities) {
    if (!city) continue;

    const res = await executeQuery(
      `SELECT id_oras FROM Oras WHERE LOWER(denumire_oras) = :city_name`,
      { city_name: city.toLowerCase() },
    );

    if (res.length === 0) continue;

    const id_oras = res[0].ID_ORAS;

    await executeQuery(
      `MERGE INTO CentruCompanie c
       USING (
         SELECT :comp_id AS id_companie,
                :oras_id AS id_oras,
                :addr AS adresa
         FROM dual
       ) src
       ON (c.id_companie = src.id_companie AND c.id_oras = src.id_oras)
       WHEN NOT MATCHED THEN
         INSERT (id_companie, id_oras, adresa)
         VALUES (src.id_companie, src.id_oras, src.adresa)`,
      {
        comp_id: companyId,
        oras_id: id_oras,
        addr: "Adresa necunoscuta",
      },
      { autoCommit: true },
    );
  }
}

// =========================
// LANGUAGE
// =========================
async function getLanguage(name) {
  const res = await executeQuery(
    `SELECT id_limba FROM Limba_Straina WHERE denumire_limba = :lang_name`,
    { lang_name: name },
  );

  if (res.length > 0) return res[0].ID_LIMBA;

  const insert = await executeQuery(
    `INSERT INTO Limba_Straina (id_limba, denumire_limba)
     VALUES (seq_limba.NEXTVAL, :lang_name)
     RETURNING id_limba INTO :lang_id`,
    {
      lang_name: name,
      lang_id: { dir: oracledb.BIND_OUT, type: oracledb.NUMBER },
    },
    { autoCommit: true },
  );

  return insert.outBinds.lang_id[0];
}

// =========================
// INSERT JOB
// =========================
async function insertJob(job) {
  const title = safe(job.title || job.TITLU);
  const desc = safe(job.snippet || job.DESCRIERE);
  const link = safe(job.link || job.LINK_EXTERN);
  const salariu_min = job.SALARIU_MIN || null;
  const salariu_max = job.SALARIU_MAX || null;

  // fix invalid ranges
  let sal_min = salariu_min;
  let sal_max = salariu_max;

  if (sal_min && sal_max && sal_max < sal_min) {
    sal_max = null;
  }

  const compName = safe(job.company || job.COMPANIE || "Unknown");

  const companyId = await getCompany(compName);

  const result = await executeQuery(
    `INSERT INTO Job (
      id_job, titlu, descriere, link_extern,
      data_postarii, id_companie, id_domeniu,
      tip_job, nivel_experienta,
      salariu_min, salariu_max
    ) VALUES (
      seq_job.NEXTVAL,
      :job_title,
      :job_desc,
      :job_link,
      SYSDATE,
      :job_comp,
      :job_domain,
      :job_type,
      :job_exp,
      :job_sal_min,
      :job_sal_max
    )
    RETURNING id_job INTO :job_id`,
    {
      job_title: title,
      job_desc: desc,
      job_link: link,
      job_comp: companyId,
      job_domain: detectDomainId(title + " " + desc),
      job_type: mapJobType(job.type || job.TIP_JOB),
      job_exp: mapExperience(title),
      job_sal_min: sal_min,
      job_sal_max: sal_max,
      job_id: { dir: oracledb.BIND_OUT, type: oracledb.NUMBER },
    },
    { autoCommit: true },
  );

  const jobId = result.outBinds.job_id[0];

  // LANGUAGES
  const langs = job.LIMBI || [];

  for (const l of langs) {
    const name = typeof l === "string" ? l : l.limba;
    if (!name) continue;

    const langId = await getLanguage(name);

    await executeQuery(
      `MERGE INTO Job_Limba_Straina j
       USING (
         SELECT :jid AS id_job, :lid AS id_limba FROM dual
       ) src
       ON (j.id_job = src.id_job AND j.id_limba = src.id_limba)
       WHEN NOT MATCHED THEN
         INSERT (id_job, id_limba, nivel)
         VALUES (src.id_job, src.id_limba, :lvl)`,
      {
        jid: jobId,
        lid: langId,
        lvl: mapLanguageLevel(l.nivel),
      },
      { autoCommit: true },
    );
  }

  // ORAS LINK
  await linkCompanyToCity(companyId, job.LOCATII || []);

  console.log("✅ Imported:", title);
}

// =========================
// RUN
// =========================
async function run() {
  await initialize();

  await cleanDatabase();

  console.log("🚀 JOOBLE...");
  for (const j of joobleJobs) await insertJob(j);

  console.log("🚀 BESTJOBS...");
  for (const j of bestJobs) await insertJob(j);

  console.log("🚀 EJOBS...");
  for (const j of eJobs) await insertJob(j);

  console.log("🎉 DONE");
}

run().catch((err) => console.error("❌ FATAL:", err));
