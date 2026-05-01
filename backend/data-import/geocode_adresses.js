require("dotenv").config({ path: "../.env" });

const axios = require("axios");
const oracledb = require("oracledb");
const { initialize, executeQuery } = require("../db");

oracledb.fetchAsString = [oracledb.CLOB];

// =========================
// CACHE
// =========================
const cache = new Map();

// =========================
// HELPERS
// =========================
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function safeRequest(fn, retries = 3) {
  for (let i = 0; i < retries; i++) {
    try {
      return await fn();
    } catch (err) {
      if (err.response?.status === 429) {
        console.log(`⏳ 429 retry ${i + 1}/${retries}`);
        await sleep(3000 * (i + 1));
      } else {
        return null;
      }
    }
  }
  return null;
}

// =========================
// DB
// =========================
async function getCompanyCityPairs() {
  return await executeQuery(`
    SELECT 
      cc.id_companie,
      cc.id_oras,
      c.denumire_companie,
      o.denumire_oras,
      cc.adresa
    FROM CentruCompanie cc
    JOIN Companie c ON c.id_companie = cc.id_companie
    JOIN Oras o ON o.id_oras = cc.id_oras
  `);
}

async function updateLocation(idComp, idOras, data) {
  await executeQuery(
    `UPDATE CentruCompanie
     SET adresa = :addr,
         latitudine = :lat,
         longitudine = :lon
     WHERE id_companie = :cid
       AND id_oras = :oid`,
    {
      addr: data.address,
      lat: data.lat,
      lon: data.lon,
      cid: idComp,
      oid: idOras,
    },
    { autoCommit: true },
  );
}

// =========================
// 1. NOMINATIM (OSM)
// =========================
async function geocodeNominatim(query) {
  return safeRequest(async () => {
    const res = await axios.get("https://nominatim.openstreetmap.org/search", {
      params: {
        q: query,
        format: "json",
        limit: 1,
      },
      headers: {
        "User-Agent": "geo-multi-system/1.0 (contact@email.com)",
      },
      timeout: 8000,
    });

    if (res.data?.length) {
      const d = res.data[0];
      return {
        address: d.display_name,
        lat: parseFloat(d.lat),
        lon: parseFloat(d.lon),
      };
    }

    return null;
  });
}

// =========================
// 2. PHOTON (OSM alternative)
// =========================
async function geocodePhoton(query) {
  return safeRequest(async () => {
    const res = await axios.get("https://photon.komoot.io/api/", {
      params: {
        q: query,
        limit: 1,
      },
      timeout: 8000,
    });

    if (res.data?.features?.length) {
      const f = res.data.features[0];

      return {
        address: f.properties.name + ", " + f.properties.city,
        lat: f.geometry.coordinates[1],
        lon: f.geometry.coordinates[0],
      };
    }

    return null;
  });
}

// =========================
// MULTI GEOCODER PIPELINE
// =========================
async function geocode(company, city) {
  const key = `${company}-${city}`;
  if (cache.has(key)) return cache.get(key);

  const query = `${company}, ${city}, Romania`;

  let result =
    (await geocodeNominatim(query)) ||
    (await geocodePhoton(query)) ||
    (await geocodeNominatim(city + ", Romania"));

  cache.set(key, result);

  return result;
}

// =========================
// MAIN
// =========================
async function run() {
  await initialize();

  const rows = await getCompanyCityPairs();

  for (const row of rows) {
    if (row.ADRESA && row.ADRESA !== "Adresa necunoscuta") continue;

    const company = row.DENUMIRE_COMPANIE;
    const city = row.DENUMIRE_ORAS;

    console.log(`🔎 ${company} - ${city}`);

    const geo = await geocode(company, city);

    if (geo) {
      await updateLocation(row.ID_COMPANIE, row.ID_ORAS, geo);
      console.log("✅", geo.address);
    } else {
      console.log("⚠️ Not found");
    }

    // SAFE RATE LIMIT (pentru toate API-urile)
    await sleep(2500);
  }

  console.log("🎉 DONE");
}

run().catch((e) => console.error("❌ FATAL:", e));
