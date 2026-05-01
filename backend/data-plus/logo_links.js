require("dotenv").config({ path: "../.env" });

const axios = require("axios");
const oracledb = require("oracledb");
const { initialize, executeQuery } = require("../db");

oracledb.fetchAsString = [oracledb.CLOB];

// =========================
// CACHE
// =========================
const cache = new Map();

// delay helper
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// =========================
// DB
// =========================
async function getCompanies() {
  return await executeQuery(`
    SELECT id_companie, denumire_companie, logo
    FROM Companie
  `);
}

async function updateLogo(id, logo) {
  await executeQuery(
    `UPDATE Companie SET logo = :l WHERE id_companie = :id`,
    { l: logo, id },
    { autoCommit: true },
  );
}

// =========================
// LOGO GENERATOR (FREE)
// =========================
function generateLogoFromName(name) {
  const clean = name
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9 ]/g, "")
    .trim()
    .split(" ")
    .filter(Boolean)
    .join("");

  return `https://img.logo.dev/${clean}.com`;
}

// =========================
// OPTIONAL: DuckDuckGo (best effort, still free)
// =========================
async function tryGetWebsiteDomain(name) {
  try {
    const res = await axios.get("https://api.duckduckgo.com/", {
      params: {
        q: `${name} official website`,
        format: "json",
        no_redirect: 1,
        no_html: 1,
      },
      timeout: 8000,
    });

    const url =
      res.data?.AbstractURL || res.data?.Results?.[0]?.FirstURL || null;

    if (!url) return null;

    return url
      .replace(/^https?:\/\//, "")
      .replace(/^www\./, "")
      .split("/")[0];
  } catch {
    return null;
  }
}

// =========================
// PIPELINE (logo only)
// =========================
async function buildLogo(name) {
  if (cache.has(name)) return cache.get(name);

  let domain = await tryGetWebsiteDomain(name);

  let logo;

  if (domain) {
    // best case: real domain
    logo = `https://img.logo.dev/${domain}`;
  } else {
    // fallback: heuristic
    logo = generateLogoFromName(name);
  }

  cache.set(name, logo);
  return logo;
}

function hasValidLogo(logo) {
  if (!logo) return false;
  if (logo === "Adresa necunoscuta") return false;
  if (logo.trim() === "") return false;
  if (!logo.startsWith("http")) return false;
  return true;
}

// =========================
// MAIN
// =========================
async function run() {
  await initialize();

  const companies = await getCompanies();

  for (const c of companies) {
    if (hasValidLogo(c.LOGO)) {
      console.log("SKIP valid logo:", c.DENUMIRE_COMPANIE);
      continue;
    }

    console.log(`🎨 ${c.DENUMIRE_COMPANIE}`);

    const logo = await buildLogo(c.DENUMIRE_COMPANIE);

    await updateLogo(c.ID_COMPANIE, logo);

    console.log("✅", logo);

    await sleep(600); // safe throttle
  }

  console.log("🎉 DONE");
}

run().catch((e) => console.error("❌ FATAL:", e));
