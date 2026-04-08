require("dotenv").config({ path: "../.env" });
const fs = require("fs");
const puppeteer = require("puppeteer");

const START_URL =
  "https://www.ejobs.ro/locuri-de-munca/salarii/bucuresti,cluj-napoca,timisoara,iasi,constanta,craiova,brasov,arad,oradea,ploiesti,sibiu/constructii--instalatii,educatie-training--arte,financiar-contabilitate,inginerie,it-software,marketing,resurse-umane-psihologie,turism--hotel-staff,vanzari";

async function fetchJobs() {
  const browser = await puppeteer.launch({
    headless: true,
  });

  const page = await browser.newPage();

  const allJobs = [];
  let nextPage = START_URL;

  try {
    while (nextPage) {
      console.log(`📄 Loading page: ${nextPage}`);

      await page.goto(nextPage, {
        waitUntil: "networkidle2",
      });

      await page.waitForSelector("li.job-card-wrapper", {
        timeout: 15000,
      });

      // -----------------------------
      // SCROLL UNTIL ALL JOBS LOAD
      // -----------------------------
      await scrollToLoadAllJobs(page);

      // -----------------------------
      // EXTRACT JOBS (LIST PAGE)
      // -----------------------------
      const jobs = await page.evaluate(() => {
        return Array.from(document.querySelectorAll("li.job-card-wrapper"))
          .map((job) => {
            const title = job
              .querySelector("h2.job-card-content-middle__title span")
              ?.innerText.trim();

            const link = job.querySelector(
              "h2.job-card-content-middle__title a",
            )?.href;

            const company = job.querySelector("h3 a")?.innerText.trim();

            return { title, link, company };
          })
          .filter((j) => j.title && j.link);
      });

      console.log(`➡️ Jobs found: ${jobs.length}`);

      // -----------------------------
      // SCRAPE EACH JOB DETAIL PAGE
      // -----------------------------
      for (const job of jobs) {
        const jobPage = await browser.newPage();

        try {
          await jobPage.goto(job.link, {
            waitUntil: "networkidle2",
          });

          const details = await jobPage.evaluate(() => {
            // DESCRIPTION
            const description = Array.from(
              document.querySelectorAll(".jobs-show-main-description__section"),
            )
              .map((el) => el.innerText.trim())
              .join("\n\n");

            // META
            const meta = Array.from(
              document.querySelectorAll(
                ".jobs-show-main-description__meta-item",
              ),
            ).map((el) => el.innerText.trim());

            const postedDate = meta.find((m) => m.includes("Publicat")) || null;

            // SUMMARIES
            const summaries = Array.from(
              document.querySelectorAll(".jobs-show-main-summaries__summary"),
            );

            let salaryText = null;
            let jobType = null;
            let experience = null;
            let locations = [];
            let languages = [];

            summaries.forEach((s) => {
              const label = s
                .querySelector(".jobs-show-main-summaries__summary-prop")
                ?.getAttribute("title");

              const valueEl = s.querySelector(
                ".jobs-show-main-summaries__summary-value",
              );

              if (!label || !valueEl) return;

              const valueText = valueEl.innerText.trim();

              if (label.includes("Salariu")) {
                salaryText = valueText;
              }

              if (label.includes("Tipul job")) {
                jobType = valueText;
              }

              if (label.includes("Nivel carieră")) {
                experience = valueText;
              }

              if (label.includes("Oraș de lucru")) {
                locations = Array.from(valueEl.querySelectorAll("a"))
                  .map((a) => a.innerText.replace(",", "").trim())
                  .filter(Boolean);
              }

              if (label.includes("Limbă străină")) {
                languages = Array.from(valueEl.querySelectorAll("a"))
                  .map((a) => a.innerText.trim())
                  .filter(Boolean);
              }
            });

            // SALARY PARSE
            let salariu_min = null;
            let salariu_max = null;

            if (salaryText) {
              const match = salaryText.match(/([\d,.]+)\s*-\s*([\d,.]+)/);

              if (match) {
                salariu_min = parseInt(match[1].replace(/[^\d]/g, ""));
                salariu_max = parseInt(match[2].replace(/[^\d]/g, ""));
              }
            }

            return {
              description,
              postedDate,
              jobType,
              experience,
              salariu_min,
              salariu_max,
              locations,
              languages,
            };
          });

          allJobs.push({
            TITLU: job.title,
            DESCRIERE: details.description,
            LINK_EXTERN: job.link,
            DATA_POSTARII: details.postedDate,
            COMPANIE: job.company,

            TIP_JOB: details.jobType,
            NIVEL_EXPERIENTA: details.experience,

            SALARIU_MIN: details.salariu_min,
            SALARIU_MAX: details.salariu_max,

            LOCATII: details.locations,
            LIMBI: details.languages,
          });

          console.log(`✔ ${job.title}`);
        } catch (err) {
          console.log(`❌ Error job: ${job.link}`);
        }

        await jobPage.close();
        await delay(300);
      }

      // -----------------------------
      // NEXT PAGE
      // -----------------------------
      const nextPageUrl = await page.evaluate(() => {
        const nextBtn = document.querySelector(
          "a.jobs-list-paginator__button--next",
        );
        return nextBtn ? nextBtn.href : null;
      });

      nextPage = nextPageUrl;

      console.log("➡️ Next page:", nextPage);

      await delay(1200);
    }

    fs.writeFileSync("jobs_ejobs.json", JSON.stringify(allJobs, null, 2));

    console.log(`🎉 DONE: ${allJobs.length} jobs scraped`);

    await browser.close();
  } catch (err) {
    console.error("❌ Fatal error:", err.message);
    await browser.close();
  }
}

// -----------------------------
// FIXED SCROLL LOGIC
// -----------------------------
async function scrollToLoadAllJobs(page) {
  let prevCount = 0;
  let sameCount = 0;

  const MAX_IDLE_ROUNDS = 8;

  while (sameCount < MAX_IDLE_ROUNDS) {
    const count = await page.evaluate(
      () => document.querySelectorAll("li.job-card-wrapper").length,
    );

    console.log(`🔄 Loaded jobs: ${count}`);

    if (count === prevCount) {
      sameCount++;
    } else {
      sameCount = 0;
      prevCount = count;
    }

    // smooth incremental scroll (better than full jump)
    await page.evaluate(() => {
      window.scrollBy(0, window.innerHeight * 1.5);
    });

    await delay(1500);
  }

  console.log(`✅ Final jobs detected: ${prevCount}`);
}

// -----------------------------
function delay(ms) {
  return new Promise((res) => setTimeout(res, ms));
}

fetchJobs();
