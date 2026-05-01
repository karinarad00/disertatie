require("dotenv").config({ path: "../.env" });

const oracledb = require("oracledb");
const { initialize, executeQuery } = require("../db");

oracledb.fetchAsString = [oracledb.CLOB];

// =========================
// DOMAIN DETECTION (10 DOMAINS ONLY)
// =========================
function detectDomainId(text) {
  const t = (text || "").toLowerCase();

  // 1️⃣ IT / Software
  if (
    t.match(
      /\b(software|developer|programator|frontend|backend|fullstack|java|javascript|python|react|node|devops|qa|tester|cyber|it support|helpdesk|web)\b/,
    )
  )
    return 1;

  // 2️⃣ Finanțe / Bănci
  if (
    t.match(
      /\b(finance|account|contabil|audit|facturare|financiar|banca|credit|casier)\b/,
    )
  )
    return 2;

  // 3️⃣ Marketing / PR
  if (
    t.match(
      /\b(marketing|seo|ads|social media|content|copywriter|branding|promovare|pr)\b/,
    )
  )
    return 3;

  // 4️⃣ Inginerie
  if (
    t.match(
      /\b(engineer|inginer|proiectant|autocad|tehnic|topograf|cad|electric|mecanic|productie)\b/,
    )
  )
    return 4;

  // 5️⃣ Sănătate / Medical
  if (
    t.match(/\b(medical|doctor|farmacist|asistent|clinica|spital|stomatolog)\b/)
  )
    return 5;

  // 6️⃣ Educație
  if (t.match(/\b(teacher|profesor|educator|invatator|trainer|meditatii)\b/))
    return 6;

  // 7️⃣ Construcții
  if (t.match(/\b(construct|instalator|electrician|zugrav|tamplar|santier)\b/))
    return 7;

  // 8️⃣ Turism / Hoteluri
  if (t.match(/\b(hotel|horeca|bucatar|ospatar|receptioner|barista|turism)\b/))
    return 8;

  // 9️⃣ Resurse Umane
  if (t.match(/\b(hr|recruiter|resurse umane|recrutare)\b/)) return 9;

  // 🔟 Vânzări (EXTINS - aici intră multe fallback-uri reale)
  if (
    t.match(
      /\b(sales|vanzari|agent|consultant|reprezentant|account manager|business development|bdm|magazin|retail|vanzator|lucrator comercial|manager magazin)\b/,
    )
  )
    return 10;

  // 🟡 fallback inteligent
  // joburi gen: secretara, operator, gestionar → cel mai apropiat în schema ta = Vânzări
  if (
    t.match(
      /\b(secretara|office|administrativ|operator|calculator|gestionar|depozit|logistica)\b/,
    )
  )
    return 10;

  return null; // 🔒 important
}

// =========================
// UPDATE DOMAINS
// =========================
async function fixDomains() {
  await initialize();

  console.log("🔍 Loading jobs...");

  const jobs = await executeQuery(`
    SELECT id_job, titlu, descriere, id_domeniu
    FROM Job
  `);

  let updated = 0;
  let skipped = 0;

  for (const job of jobs) {
    const text = `${job.TITLU || ""} ${job.DESCRIERE || ""}`;

    const newDomain = detectDomainId(text);

    if (!newDomain) {
      skipped++;
      continue;
    }

    if (job.ID_DOMENIU === newDomain) {
      continue;
    }

    await executeQuery(
      `UPDATE Job
       SET id_domeniu = :dom
       WHERE id_job = :id`,
      {
        dom: newDomain,
        id: job.ID_JOB,
      },
      { autoCommit: true },
    );

    updated++;

    console.log(
      `✏️ ${job.ID_JOB} | ${job.TITLU?.slice(0, 40)} -> ${newDomain}`,
    );
  }

  console.log("\n=====================");
  console.log(`✅ Updated: ${updated}`);
  console.log(`⏭️ Skipped: ${skipped}`);
  console.log("=====================");
}

// =========================
// RUN
// =========================
fixDomains().catch((err) => {
  console.error("❌ ERROR:", err);
});
