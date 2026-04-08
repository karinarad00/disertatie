require("dotenv").config({ path: "../.env" });
const fs = require("fs");
const axios = require("axios");

const API_KEY = process.env.JOOBLE_KEY;
console.log("KEY:", API_KEY);
async function fetchJobs() {
  let allJobs = [];

  try {
    for (let page = 1; page <= 5; page++) {
      console.log(`Fetching page ${page}...`);

      const res = await axios.post(`https://jooble.org/api/${API_KEY}`, {
        keywords: "",
        location: "Romania",
        page: page,
      });

      if (!res.data.jobs || res.data.jobs.length === 0) break;

      allJobs = allJobs.concat(res.data.jobs);
    }

    fs.writeFileSync("jooble_jobs_ro.json", JSON.stringify(allJobs, null, 2));

    console.log(`✅ Saved ${allJobs.length} jobs!`);
  } catch (err) {
    console.error("❌ Error:", err.message);
  }
}

fetchJobs();
