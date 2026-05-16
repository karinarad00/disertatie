const express = require("express");
const router = express.Router();
const { executeQuery } = require("../db");
const oracledb = require("oracledb");
const authenticateToken = require("../middleware/authMiddleware");
const cacheMiddleware = require("../middleware/cacheMiddleware");
const { cache } = require("../middleware/cacheMiddleware");

// Ruta pentru joburile de la companiile cu subscriptie activa
router.get("/promoted", async (req, res) => {
  try {
    const jobs = await executeQuery(`
      SELECT 
        j.ID_JOB, 
        j.TITLU, 
        j.PROMOTED,
        c.DENUMIRE_COMPANIE
      FROM job j
      JOIN companie c ON j.ID_COMPANIE = c.ID_COMPANIE
      WHERE j.PROMOTED = 1
    `);
    res.json(jobs);
  } catch (err) {
    console.error("Eroare în /promoted:", err);
    res.status(500).json({ error: "Eroare la preluarea joburilor promovate" });
  }
});

// Ruta pentru toate joburile care se potrivesc cu filtrele de căutare si cu paginare
router.get("/all", async (req, res) => {
  try {
    const {
      search,
      city,
      company,
      experience,
      domain,
      period,
      page = 1,
      limit = 5,
    } = req.query;

    const offset = (page - 1) * limit;

    let filters = [];
    let binds = {};

    if (search) {
      filters.push(`LOWER(j.titlu) LIKE :search`);
      binds.search = `%${search.toLowerCase()}%`;
    }

    if (city) {
      filters.push(`LOWER(o.denumire_oras) LIKE :city`);
      binds.city = `%${city.toLowerCase()}%`;
    }

    if (company) {
      filters.push(`c.denumire_companie = :company`);
      binds.company = company;
    }

    if (experience) {
      filters.push(`j.nivel_experienta = :experience`);
      binds.experience = experience;
    }

    if (domain) {
      filters.push(`d.denumire_domeniu = :domain`);
      binds.domain = domain;
    }

    if (period) {
      if (period === "24h") filters.push(`j.data_postarii >= SYSDATE - 1`);
      if (period === "3d") filters.push(`j.data_postarii >= SYSDATE - 3`);
      if (period === "7d") filters.push(`j.data_postarii >= SYSDATE - 7`);
    }

    const whereClause = filters.length ? `WHERE ${filters.join(" AND ")}` : "";

    // 🔢 TOTAL COUNT
    const countSql = `
      SELECT COUNT(DISTINCT j.id_job) AS TOTAL
      FROM job j
      LEFT JOIN companie c ON j.id_companie = c.id_companie
      LEFT JOIN centrucompanie cc ON cc.id_companie = c.id_companie
      LEFT JOIN oras o ON cc.id_oras = o.id_oras
      LEFT JOIN domeniu d ON j.id_domeniu = d.id_domeniu
      ${whereClause}
    `;

    const totalResult = await executeQuery(countSql, binds);
    const total = totalResult[0].TOTAL;

    // 📄 DATA QUERY
    const sql = `
      SELECT * FROM (
        SELECT 
          j.id_job AS ID_JOB,
          j.titlu AS TITLU,
          j.data_postarii AS DATA_POSTARII,
          j.tip_job AS TIP_JOB,
          j.nivel_experienta AS NIVEL_EXPERIENTA,
          c.id_companie AS ID_COMPANIE,
          c.denumire_companie AS DENUMIRE_COMPANIE,
          c.logo AS LOGO,
          LISTAGG(o.denumire_oras, ', ') 
            WITHIN GROUP (ORDER BY o.denumire_oras) AS LOCATIE,
          d.denumire_domeniu AS DOMENIU,
          ROW_NUMBER() OVER (ORDER BY j.data_postarii DESC) rn
        FROM job j
        LEFT JOIN companie c ON j.id_companie = c.id_companie
        LEFT JOIN centrucompanie cc ON cc.id_companie = c.id_companie
        LEFT JOIN oras o ON cc.id_oras = o.id_oras
        LEFT JOIN domeniu d ON j.id_domeniu = d.id_domeniu
        ${whereClause}
        GROUP BY 
          j.id_job, j.titlu, j.data_postarii,
          j.tip_job, j.nivel_experienta,
          c.id_companie, c.denumire_companie,
          c.logo, d.denumire_domeniu
      )
      WHERE rn BETWEEN :startRow AND :endRow
    `;

    binds.startRow = offset + 1;
    binds.endRow = offset + Number(limit);

    const jobs = await executeQuery(sql, binds);

    // ✅ return BOTH
    res.json({
      jobs,
      total,
    });
  } catch (err) {
    console.error("Eroare în /api/jobs/all:", err);
    res.status(500).json({ error: "Eroare la preluare" });
  }
});

// Ruta pentru a prelua opțiunile unice pentru filtre (companii, domenii, experiență, locații)
router.get("/filters", async (req, res) => {
  try {
    const companies = await executeQuery(
      `SELECT DISTINCT denumire_companie FROM Companie`
    );
    const domains = await executeQuery(
      `SELECT DISTINCT denumire_domeniu FROM Domeniu`
    );
    const experience = await executeQuery(
      `SELECT DISTINCT nivel_experienta FROM Job`
    );

    // Orașe disponibile pentru joburi – acum cu ID
    const locations = await executeQuery(`
      SELECT DISTINCT o.id_oras, o.denumire_oras
      FROM Job j
      JOIN CentruCompanie cc ON j.id_companie = cc.id_companie
      JOIN Oras o ON cc.id_oras = o.id_oras
    `);

    res.json({
      companies: companies.map((c) => c.DENUMIRE_COMPANIE),
      domains: domains.map((d) => d.DENUMIRE_DOMENIU),
      experience: experience.map((e) => e.NIVEL_EXPERIENTA),
      locations: locations.map((l) => ({ id_oras: l.ID_ORAS, denumire_oras: l.DENUMIRE_ORAS })),
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Eroare la filtre" });
  }
});

// Ruta pentru un singur job după ID, cu salariu și adrese ca array
router.get("/:id", async (req, res) => {
  const id = Number(req.params.id);

  try {
    // 1. Preluăm jobul
    const jobs = await executeQuery(
      `
      SELECT 
        j.id_job,
        j.titlu,
        j.descriere,
        j.link_extern,
        j.data_postarii,
        j.tip_job,
        j.nivel_experienta,
        j.salariu_min,
        j.salariu_max,
        c.id_companie,
        c.denumire_companie,
        c.email,
        c.website,
        c.descriere AS descriere_companie,
        c.logo,
        d.id_domeniu,
        d.denumire_domeniu
      FROM job j
      LEFT JOIN companie c ON j.id_companie = c.id_companie
      LEFT JOIN domeniu d ON j.id_domeniu = d.id_domeniu
      WHERE j.id_job = :id
      `,
      { id },
    );

    if (jobs.length === 0) {
      return res.status(404).json({ error: "Jobul nu a fost găsit" });
    }

    const job = jobs[0];

    // 2. Preluăm adresele companiei ca array
    const addresses = await executeQuery(
      `
      SELECT cc.adresa AS address, o.denumire_oras AS city
      FROM CentruCompanie cc
      JOIN Oras o ON cc.id_oras = o.id_oras
      WHERE cc.id_companie = :companyId
      `,
      { companyId: job.ID_COMPANIE || job.id_companie },
    );

    job.adrese = addresses; // array de { address, city }

    res.json(job);
  } catch (err) {
    console.error(`Eroare în /api/jobs/${id}:`, err);
    res.status(500).json({ error: "Eroare la preluarea jobului" });
  }
});

// GET joburi active pentru companie cu numărul de aplicanți
router.get("/by-company/:id", async (req, res) => {
  const id = Number(req.params.id);
  const { promotable } = req.query; // optional query param: ?promotable=1

  try {
    let sql = `
      SELECT 
        j.id_job AS "id",
        j.titlu AS "title",
        j.promoted AS "promoted",
        COUNT(aj.id_job) AS "applicants",
        TO_CHAR(j.data_postarii, 'DD Mon YYYY') AS "posted"
      FROM Job j
      LEFT JOIN Aplicare_Job aj ON j.id_job = aj.id_job
      WHERE j.id_companie = :id
    `;

    // filtrare optională pentru joburile care pot fi promovate
    if (promotable === "1") {
      sql += ` AND j.promoted = 0`;
    }

    sql += `
      GROUP BY j.id_job, j.titlu, j.data_postarii, j.promoted
      ORDER BY j.data_postarii DESC
    `;

    const jobs = await executeQuery(sql, { id });

    res.json(jobs);
  } catch (err) {
    console.error("Eroare la preluarea joburilor:", err);
    res.status(500).json({ message: "Eroare server." });
  }
});

// Create Job
router.post("/create", authenticateToken, async (req, res) => {
  const {
    titlu,
    tipJob,
    nivelExperienta,
    salariuMin,
    salariuMax,
    descriere,
    linkCariera,
    idDomeniu,
    idCompanie,
  } = req.body;

  if (!titlu || !tipJob || !nivelExperienta || !idDomeniu) {
    return res.status(400).json({
      error:
        "Titlul, tipul jobului, nivelul experienței și domeniul sunt obligatorii",
    });
  }

  const min = salariuMin !== "" ? Number(salariuMin) : null;
  const max = salariuMax !== "" ? Number(salariuMax) : null;

  if (min === null && max === null) {
    return res.status(400).json({
      error: "Trebuie să completezi cel puțin salariul minim sau maxim",
    });
  }

  if (min !== null && max !== null && max < min) {
    return res.status(400).json({
      error:
        "Salariul maxim trebuie să fie mai mare sau egal decât salariul minim",
    });
  }

  try {
    const sql = `
      INSERT INTO Job (
        id_job,
        titlu,
        descriere,
        tip_job,
        nivel_experienta,
        salariu_min,
        salariu_max,
        id_companie,
        link_extern,
        id_domeniu
      ) VALUES (
        seq_job.NEXTVAL,
        :titlu,
        :descriere,
        :tipJob,
        :nivelExperienta,
        :salariuMin,
        :salariuMax,
        :companyId,
        :linkCariera,
        :idDomeniu
      )
      RETURNING id_job INTO :id_job
    `;

    const binds = {
      titlu,
      descriere: descriere || null,
      tipJob,
      nivelExperienta,
      salariuMin: min,
      salariuMax: max,
      companyId: idCompanie,
      linkCariera: linkCariera || null,
      idDomeniu,
      id_job: { dir: oracledb.BIND_OUT, type: oracledb.NUMBER },
    };

    const result = await executeQuery(sql, binds, { autoCommit: true });

    res.json({
      message: "Job creat cu succes!",
      jobId: result.outBinds.id_job[0],
    });
  } catch (err) {
    console.error("Eroare la crearea jobului:", err);
    res.status(500).json({
      error: "Eroare internă la crearea jobului",
      details: err.message,
    });
  }
});

// Update Job
router.put("/update/:id", authenticateToken, async (req, res) => {
  const jobId = Number(req.params.id);

  const {
    titlu,
    tipJob,
    nivelExperienta,
    salariuMin,
    salariuMax,
    descriere,
    linkCariera,
    idDomeniu,
    idCompanie,
  } = req.body;

  if (!titlu || !tipJob || !nivelExperienta || !idDomeniu) {
    return res.status(400).json({
      error:
        "Titlul, tipul jobului, nivelul experienței și domeniul sunt obligatorii",
    });
  }

  const min = salariuMin !== "" ? Number(salariuMin) : null;
  const max = salariuMax !== "" ? Number(salariuMax) : null;

  if (min === null && max === null) {
    return res.status(400).json({
      error: "Trebuie să completezi cel puțin salariul minim sau maxim",
    });
  }

  if (min !== null && max !== null && max < min) {
    return res.status(400).json({
      error:
        "Salariul maxim trebuie să fie mai mare sau egal decât salariul minim",
    });
  }

  try {
    const sql = `
      UPDATE Job SET
        titlu = :titlu,
        descriere = :descriere,
        tip_job = :tipJob,
        nivel_experienta = :nivelExperienta,
        salariu_min = :salariuMin,
        salariu_max = :salariuMax,
        id_companie = :companyId,
        link_extern = :linkCariera,
        id_domeniu = :idDomeniu
      WHERE id_job = :jobId
    `;

    const binds = {
      titlu,
      descriere: descriere || null,
      tipJob,
      nivelExperienta,
      salariuMin: min,
      salariuMax: max,
      companyId: idCompanie,
      linkCariera: linkCariera || null,
      idDomeniu,
      jobId,
    };

    await executeQuery(sql, binds, { autoCommit: true });

    cache.del(`/api/jobs/${jobId}`);

    res.json({ message: "Job actualizat cu succes!" });
  } catch (err) {
    console.error(`Eroare la actualizarea jobului ${jobId}:`, err);
    res.status(500).json({ error: "Eroare internă la actualizarea jobului" });
  }
});

// Promovare Job (manual update after payment)
router.put("/promote/:id", authenticateToken, async (req, res) => {
  const jobId = Number(req.params.id);

  try {
    await executeQuery(
      `UPDATE Job SET promoted = 1 WHERE id_job = :jobId`,
      { jobId },
      { autoCommit: true }
    );

    cache.del(`/api/jobs/${jobId}`);
    res.json({ message: "Job promovat cu succes!" });
  } catch (err) {
    console.error(`Eroare la promovarea jobului ${jobId}:`, err);
    res.status(500).json({ error: "Eroare internă la promovarea jobului" });
  }
});

module.exports = router;
