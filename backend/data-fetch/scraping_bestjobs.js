require("dotenv").config({ path: "../.env" });
const fs = require("fs");
const puppeteer = require("puppeteer");

console.log("🚀 Script started...");

// -------------------------
// CONFIG
// -------------------------
const START_URL =
  "https://www.bestjobs.eu/locuri-de-munca-in-bucuresti,iasi,cluj-napoca,craiova,timisoara,brasov,constanta,sibiu,oradea,arad,ploiesti/construction,finance,education,engineering,it,marketing,medicine,hr,horeca,sales?domain[]=4&domain[]=7&domain[]=13&domain[]=14&domain[]=9&domain[]=10&domain[]=15&domain[]=18&domain[]=3&domain[]=1&location[]=Bucure%C8%99ti&location[]=Ia%C8%99i&location[]=Cluj-Napoca&location[]=Craiova&location[]=Timi%C8%99oara&location[]=Bra%C8%99ov&location[]=Constan%C8%9Ba&location[]=Sibiu&location[]=Oradea&location[]=Arad&location[]=Ploie%C8%99ti";

const ALLOWED_CITIES = [
  "Craiova",
  "București",
  "Cluj-Napoca",
  "Timișoara",
  "Iași",
  "Brașov",
  "Constanța",
  "Sibiu",
  "Oradea",
  "Arad",
  "Ploiești",
];

// -------------------------
// HELPERS
// -------------------------
function clean(text) {
  return text ? text.replace(/\s+/g, " ").trim() : null;
}

function normalizeCompany(name) {
  return clean(name)?.toUpperCase();
}

// -------------------------
// MAIN
// -------------------------
async function fetchJobs() {
  const browser = await puppeteer.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });

  const page = await browser.newPage();
  const allJobs = [];

  try {
    console.log("📄 Opening BestJobs...");
    await page.goto(START_URL, { waitUntil: "domcontentloaded" });

    await page.waitForSelector("a[href*='/loc-de-munca/']", {
      timeout: 15000,
    });

    await loadAllJobs(page);

    const jobs = await page.evaluate(() => {
      return Array.from(document.querySelectorAll("a[href*='/loc-de-munca/']"))
        .map((a) => {
          const card = a.closest("div.flex.flex-col");

          return {
            title: card?.querySelector("h2")?.innerText.trim() || "",
            company:
              card?.querySelector(".text-ink-medium")?.innerText.trim() || "",
            link: "https://www.bestjobs.eu" + a.getAttribute("href"),
          };
        })
        .filter((j) => j.title && j.link);
    });

    console.log(`➡️ Found ${jobs.length} jobs`);

    for (const job of jobs) {
      console.log(`🔗 Opening: ${job.link}`);

      const jobPage = await browser.newPage();

      try {
        await jobPage.goto(job.link, { waitUntil: "domcontentloaded" });

        const details = await jobPage.evaluate((ALLOWED_CITIES) => {
          const clean = (t) => t?.replace(/\s+/g, " ").trim();

          // -------------------------
          // SALARY (FIXED LOGIC)
          // -------------------------
          const salaryRange = (() => {
            let el =
              document.querySelector(
                "div.flex.items-center span.text-base.font-bold",
              ) || document.querySelector("div.ml-2 span.text-primary");

            let text = clean(el?.innerText);

            // fallback confidential
            if (!text || /confiden/i.test(text)) {
              const fallback = Array.from(
                document.querySelectorAll("div"),
              ).find((d) =>
                d.innerText.includes("Salarii pe poziții similare"),
              );

              const match = fallback?.innerText.match(/(\d+)\s*-\s*(\d+)/);

              if (match) {
                return { min: Number(match[1]), max: Number(match[2]) };
              }

              return null;
            }

            // interval
            let match = text.match(/(\d+)\s*-\s*(\d+)/);
            if (match) {
              return { min: Number(match[1]), max: Number(match[2]) };
            }

            // single value → ONLY min
            match = text.match(/(\d+)/);
            if (match) {
              return { min: Number(match[1]), max: null };
            }

            return null;
          })();

          // -------------------------
          // DESCRIPTION
          // -------------------------
          const description = clean(
            document.querySelector("div.prose")?.innerText,
          );

          // -------------------------
          // META FIXED
          // -------------------------
          let experience = [];
          let jobType = null;
          let locations = [];

          const container = document.querySelector(
            "div.mt-8.space-y-2.text-sm.text-ink-medium",
          );

          if (container) {
            const blocks = Array.from(container.children);

            for (const block of blocks) {
              const text = clean(block.innerText);
              if (!text) continue;

              const lower = text.toLowerCase();

              // EXPERIENCE STRICT
              if (
                lower.includes("entry") ||
                lower.includes("middle") ||
                lower.includes("senior") ||
                lower.includes("intern") ||
                lower.includes("ani")
              ) {
                experience = Array.from(block.querySelectorAll("a"))
                  .map((a) => clean(a.innerText))
                  .filter(Boolean);
                continue;
              }

              // LOCATION STRICT (FIXED BUG)
              const foundCities = ALLOWED_CITIES.filter((c) =>
                text.includes(c),
              );

              if (foundCities.length) {
                locations = [...new Set([...locations, ...foundCities])];
                continue;
              }

              // JOB TYPE STRICT
              if (/full time|part time|remote|hybrid|on site/i.test(lower)) {
                const match = text.match(
                  /(Full time|Part time|Remote|Hybrid|On site)/i,
                );
                jobType = match ? match[1] : text;
                continue;
              }
            }
          }

          // -------------------------
          // LANGUAGES
          // -------------------------
          const langHeader = Array.from(
            document.querySelectorAll("div.mt-8 h3"),
          ).find((h3) => h3.innerText.includes("Limbi vorbite"));

          let languages = [];

          if (langHeader) {
            const links =
              langHeader.nextElementSibling?.querySelectorAll("a") || [];

            languages = Array.from(links)
              .map((el) => {
                const match = el.innerText.match(/(.+)\s+\((.+)\)/);
                if (!match) return null;

                return {
                  limba: clean(match[1]),
                  nivel: clean(match[2]),
                };
              })
              .filter(Boolean);
          }

          return {
            description,
            salaryRange,
            jobType,
            experience,
            locations,
            languages,
          };
        }, ALLOWED_CITIES);

        allJobs.push({
          TITLU: clean(job.title),
          COMPANIE: normalizeCompany(job.company),
          LINK_EXTERN: job.link,

          DESCRIERE: details.description,
          TIP_JOB: details.jobType,
          NIVEL_EXPERIENTA: details.experience,

          SALARIU_MIN: details.salaryRange?.min || null,
          SALARIU_MAX: details.salaryRange?.max || null,

          LIMBI: details.languages,
          LOCATII: details.locations,
        });

        console.log(`✔ Saved: ${job.title}`);
      } catch (err) {
        console.log(`❌ Error job: ${job.link} → ${err.message}`);
      }

      await jobPage.close();
      await delay(400);
    }

    fs.writeFileSync("jobs_bestjobs.json", JSON.stringify(allJobs, null, 2));

    console.log(`✅ DONE: ${allJobs.length} jobs saved`);

    await browser.close();
  } catch (err) {
    console.error("❌ Fatal error:", err.message);
    await browser.close();
  }
}

// -------------------------
// LOAD MORE
// -------------------------
async function loadAllJobs(page) {
  let previousCount = 0;

  while (true) {
    await autoScroll(page);

    const clicked = await page.evaluate(() => {
      const btn = Array.from(document.querySelectorAll("button")).find(
        (b) => b.innerText.includes("Încarcă mai mult") && !b.disabled,
      );

      if (btn) {
        btn.click();
        return true;
      }
      return false;
    });

    if (clicked) {
      await delay(2500);
    } else {
      const currentCount = await page.evaluate(
        () => document.querySelectorAll("a[href*='/loc-de-munca/']").length,
      );

      if (currentCount === previousCount) break;

      previousCount = currentCount;
      await delay(1000);
    }
  }
}

// -------------------------
// SCROLL
// -------------------------
async function autoScroll(page) {
  await page.evaluate(async () => {
    await new Promise((resolve) => {
      let total = 0;
      const distance = 400;

      const timer = setInterval(() => {
        window.scrollBy(0, distance);
        total += distance;

        if (total >= document.body.scrollHeight) {
          clearInterval(timer);
          resolve();
        }
      }, 200);
    });
  });
}

// -------------------------
// DELAY
// -------------------------
function delay(ms) {
  return new Promise((res) => setTimeout(res, ms));
}

// -------------------------
// RUN
// -------------------------
fetchJobs().catch(console.error);
