const express = require("express");
const router = express.Router();
const { executeQuery } = require("../db");
const bcrypt = require("bcrypt");
const crypto = require("crypto");
const jwt = require("jsonwebtoken");
const authenticateToken = require("../middleware/authMiddleware");
require("dotenv").config();

const {
  sendResetEmail,
  sendEmployerRequestEmail,
  sendAdminNotificationEmail,
  sendEmployerDecisionEmail,
  sendSetPasswordEmail,
} = require("../mailer");

// ================= ADMIN STATS =================
router.get("/admin/stats", authenticateToken, async (req, res) => {
  if (req.user.role !== "Administrator") {
    return res.status(403).json({ message: "Acces interzis." });
  }

  try {
    const totalUsers = await executeQuery(
      `SELECT COUNT(*) AS total FROM Utilizator
       WHERE tip_utilizator != 'Administrator'`,
    );

    const totalJobs = await executeQuery(`SELECT COUNT(*) AS total FROM Job`);

    const totalCompanies = await executeQuery(
      `SELECT COUNT(*) AS total FROM Companie`,
    );

    const totalApps = await executeQuery(
      `SELECT COUNT(*) AS total FROM APLICARE_JOB`,
    );

    const usersByType = await executeQuery(`
      SELECT tip_utilizator AS type, COUNT(*) AS count
      FROM Utilizator
      GROUP BY tip_utilizator
    `);

    const jobsByCategory = await executeQuery(`
      SELECT d.denumire_domeniu AS CATEGORY, COUNT(j.id_job) AS COUNT
      FROM Job j
      JOIN Domeniu d ON j.id_domeniu = d.id_domeniu
      GROUP BY d.denumire_domeniu
      ORDER BY COUNT(j.id_job) DESC
    `);

    const companiesByCity = await executeQuery(`
      SELECT o.denumire_oras AS CITY, COUNT(DISTINCT c.id_companie) AS COUNT
      FROM Companie c
      JOIN CentruCompanie cc ON c.id_companie = cc.id_companie
      JOIN Oras o ON cc.id_oras = o.id_oras
      GROUP BY o.denumire_oras
      ORDER BY COUNT DESC
    `);

    res.json({
      totalUsers: totalUsers[0].TOTAL,
      totalJobs: totalJobs[0].TOTAL,
      totalCompanies: totalCompanies[0].TOTAL,
      totalApps: totalApps[0].TOTAL,
      usersByType,
      jobsByCategory,
      companiesByCity,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Eroare server." });
  }
});

// ================= ALL USERS (for admin table) ==================
router.get("/admin/users", authenticateToken, async (req, res) => {
  if (req.user.role !== "Administrator") {
    return res.status(403).json({ message: "Acces interzis." });
  }

  try {
    const users = await executeQuery(`
      SELECT 
        id_utilizator AS id,
        username,
        email,
        tip_utilizator AS role,
        created_at
      FROM Utilizator
      WHERE tip_utilizator != 'Administrator'
      ORDER BY created_at DESC
    `);

    res.json(users);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Eroare server." });
  }
});

// ================= REGISTER =================
router.post("/register", async (req, res) => {
  const { username, email, password, phone, location, experience } = req.body;

  try {
    const existing = await executeQuery(
      `SELECT COUNT(*) AS COUNT 
       FROM Utilizator 
       WHERE username = :username OR email = :email`,
      { username, email },
    );

    if (existing[0].COUNT > 0) {
      return res.status(400).json({
        message: "Username-ul sau email-ul este deja folosit.",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    await executeQuery(
      `INSERT INTO Utilizator (
        id_utilizator, username, email, parola, tip_utilizator,
        phone, location, experience
      ) VALUES (
        seq_utilizator.NEXTVAL, :username, :email, :password, 'Candidat',
        :phone, :location, :experience
      )`,
      {
        username,
        email,
        password: hashedPassword,
        phone: phone || null,
        location: location || null,
        experience: experience || null,
      },
      { autoCommit: true },
    );

    res.status(201).json({ message: "Utilizator înregistrat cu succes." });
  } catch (error) {
    console.error("Eroare la înregistrare:", error);
    res.status(500).json({ message: "Eroare server." });
  }
});

// ================= LOGIN =================
router.post("/login", async (req, res) => {
  const { email, password } = req.body;

  try {
    const result = await executeQuery(
      `SELECT 
        id_utilizator, username, email, parola, tip_utilizator,
        imagine_profil, cv_url, id_companie,
        subscriptie_cv, subscriptie_recomandari, subscriptie_angajatori,
        phone, experience, location
       FROM Utilizator
       WHERE email = :email`,
      { email },
    );

    if (result.length === 0) {
      return res.status(401).json({ message: "Utilizator inexistent." });
    }

    const user = result[0];

    const parolaOk = await bcrypt.compare(password, user.PAROLA);

    if (!parolaOk) {
      return res.status(401).json({ message: "Parolă incorectă." });
    }

    const token = jwt.sign(
      {
        id: user.ID_UTILIZATOR,
        username: user.USERNAME,
        role: user.TIP_UTILIZATOR,
      },
      process.env.SECRET_KEY,
      { expiresIn: "1d" },
    );

    res.json({
      token,
      id: user.ID_UTILIZATOR,
      username: user.USERNAME,
      email: user.EMAIL,
      role: user.TIP_UTILIZATOR,
      imagine_profil: user.IMAGINE_PROFIL,
      cv_url: user.CV_URL,
      id_companie: user.ID_COMPANIE,
      subscriptie_cv: user.SUBSCRIPTIE_CV,
      subscriptie_recomandari: user.SUBSCRIPTIE_RECOMANDARI,
      subscriptie_angajatori: user.SUBSCRIPTIE_ANGAJATORI,
      phone: user.PHONE,
      experience: user.EXPERIENCE,
      location: user.LOCATION,
    });
  } catch (error) {
    console.error("Eroare login:", error);
    res.status(500).json({ message: "Eroare server." });
  }
});

// ================= RESET REQUEST =================
router.post("/request-reset", async (req, res) => {
  const { email } = req.body;

  try {
    const userResult = await executeQuery(
      `SELECT id_utilizator FROM Utilizator WHERE email = :email`,
      { email },
    );

    if (userResult.length === 0) {
      return res.status(404).json({ message: "Email inexistent." });
    }

    const userId = userResult[0].ID_UTILIZATOR;

    const token = crypto.randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + 3600000);

    await executeQuery(
      `INSERT INTO reset_tokens (id_utilizator, token, expires_at)
       VALUES (:id_utilizator, :token, :expires_at)`,
      { id_utilizator: userId, token, expires_at: expiresAt },
      { autoCommit: true },
    );

    const resetLink = `http://localhost:3000/change-password?token=${token}`;

    await sendResetEmail(email, resetLink);

    res.json({ message: "Instrucțiuni trimise pe email." });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Eroare server." });
  }
});

// ================= RESET PASSWORD =================
router.post("/reset-password", async (req, res) => {
  const { token, newPassword } = req.body;

  try {
    const tokenResult = await executeQuery(
      `SELECT id_utilizator, expires_at 
       FROM reset_tokens 
       WHERE token = :token`,
      { token },
    );

    if (tokenResult.length === 0) {
      return res.status(400).json({ message: "Token invalid." });
    }

    const { ID_UTILIZATOR, EXPIRES_AT } = tokenResult[0];

    if (new Date() > EXPIRES_AT) {
      return res.status(400).json({ message: "Token expirat." });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await executeQuery(
      `UPDATE Utilizator 
       SET parola = :parola 
       WHERE id_utilizator = :id`,
      { parola: hashedPassword, id: ID_UTILIZATOR },
      { autoCommit: true },
    );

    await executeQuery(
      `DELETE FROM reset_tokens WHERE token = :token`,
      {
        token,
      },
      { autoCommit: true },
    );

    res.json({ message: "Parolă schimbată." });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Eroare server." });
  }
});

// ================= EMPLOYER REQUEST =================
router.post("/cereri-angajatori", async (req, res) => {
  const { id_companie, email, nume_contact, telefon, descriere } = req.body;

  if (!id_companie || !email) {
    return res
      .status(400)
      .json({ message: "Compania și email-ul sunt obligatorii." });
  }

  try {
    // Verifică dacă deja există o cerere cu același id_companie și email
    const existingRequest = await executeQuery(
      `SELECT COUNT(*) AS count FROM CereriAngajatori WHERE id_companie = :id_companie AND email = :email`,
      { id_companie, email },
    );

    if (existingRequest[0].COUNT > 0) {
      return res.status(409).json({
        message: "Există deja o cerere pentru această companie și email.",
      });
    }

    // Continuă cu inserarea dacă nu există deja
    const seqResult = await executeQuery(
      `SELECT seq_cereri_angajatori.NEXTVAL AS nextId FROM dual`,
    );
    const nextId = seqResult[0].NEXTID;

    await executeQuery(
      `INSERT INTO CereriAngajatori
         (id_cerere, id_companie, email, nume_contact, telefon, descriere, status, data_cerere)
         VALUES (:id_cerere, :id_companie, :email, :nume_contact, :telefon, :descriere, 'Pending', SYSDATE)`,
      {
        id_cerere: nextId,
        id_companie,
        email,
        nume_contact,
        telefon,
        descriere,
      },
      { autoCommit: true },
    );

    // Obține denumirea companiei pentru email
    const companyResult = await executeQuery(
      `SELECT denumire_companie FROM Companie WHERE id_companie = :id_companie`,
      { id_companie },
    );
    const denumire_companie =
      companyResult.length > 0
        ? companyResult[0].DENUMIRE_COMPANIE
        : "Necunoscută";

    // Trimite emailul de confirmare
    try {
      await sendEmployerRequestEmail(email, nume_contact);
    } catch (emailErr) {
      console.error("Eroare la trimiterea emailului:", emailErr);
    }

    // Notifică adminul (presupunem că emailul adminului este stocat în .env)
    const adminEmail = process.env.ADMIN_EMAIL;
    try {
      await sendAdminNotificationEmail(adminEmail, {
        id_cerere: nextId,
        id_companie,
        denumire_companie,
        email,
        nume_contact,
        telefon,
        descriere,
      });
    } catch (emailErr) {
      console.error("Eroare la trimiterea notificării către admin:", emailErr);
    }

    res.status(201).json({ message: "Cererea a fost înregistrată." });
  } catch (err) {
    console.error("Eroare la inserarea cererii:", err);
    res.status(500).json({ message: "Eroare server." });
  }
});

// Aprobare cerere angajator
router.post("/cereri-angajatori/:id/aproba", async (req, res) => {
  const id_cerere = req.params.id;
  console.log("ID cerere pentru aprobare (backend):", id_cerere);
  try {
    const result = await executeQuery(
      `SELECT * FROM CereriAngajatori WHERE id_cerere = :id`,
      [id_cerere],
    );

    if (result.length === 0) {
      return res.status(404).json({ message: "Cererea nu a fost găsită." });
    }

    const cerere = result[0];

    // Creează un username pe baza email-ului
    const username = cerere.EMAIL.split("@")[0];

    // 1. Obține noul ID pentru utilizator
    const seqUser = await executeQuery(
      `SELECT seq_utilizator.NEXTVAL AS nextId FROM dual`,
    );
    const userId = seqUser[0].NEXTID;

    // 2. Creezi user
    await executeQuery(
      `INSERT INTO Utilizator (id_utilizator, username, email, tip_utilizator, id_companie)
       VALUES (:id_utilizator, :username, :email, 'Angajator', :id_companie)`,
      {
        id_utilizator: userId,
        username,
        email: cerere.EMAIL,
        id_companie: cerere.ID_COMPANIE,
      },
      { autoCommit: true },
    );

    // 3. Generezi token
    const token = crypto.randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1h

    // 4. Salvezi token
    await executeQuery(
      `INSERT INTO reset_tokens (id_utilizator, token, expires_at)
       VALUES (:id_utilizator, :token, :expires_at)`,
      {
        id_utilizator: userId,
        token,
        expires_at: expiresAt,
      },
      { autoCommit: true },
    );

    // 5. Update cerere
    await executeQuery(
      `UPDATE CereriAngajatori SET status = 'Approved' WHERE id_cerere = :id`,
      [id_cerere],
      { autoCommit: true },
    );

    // 6. Link setare parolă
    const link = `http://localhost:3000/change-password?token=${token}`;

    // 7. Trimite email
    await sendSetPasswordEmail(cerere.EMAIL, link);

    res.json({ message: "Cererea a fost aprobată și email trimis." });
  } catch (err) {
    console.error("Eroare la aprobarea cererii:", err);
    res.status(500).json({ message: "Eroare server." });
  }
});

// Respingere cerere angajator
router.post("/cereri-angajatori/:id/respinge", async (req, res) => {
  const id_cerere = req.params.id;

  try {
    const result = await executeQuery(
      `SELECT * FROM CereriAngajatori WHERE id_cerere = :id`,
      [id_cerere],
    );

    if (result.length === 0) {
      return res.status(404).json({ message: "Cererea nu a fost găsită." });
    }

    await executeQuery(
      `UPDATE CereriAngajatori SET status = 'Rejected' WHERE id_cerere = :id`,
      [id_cerere],
      { autoCommit: true },
    );

    // Trimite emailul de decizie către angajator
    await sendEmployerDecisionEmail(
      result[0].EMAIL,
      "rejected",
      req.body.motiv || "Cererea a fost respinsă fără un motiv specificat.",
    );

    res.json({ message: "Cererea a fost respinsă." });
  } catch (err) {
    console.error("Eroare respingere:", err);
    res.status(500).json({ message: "Eroare server." });
  }
});

// ================= PROFIL =================
router.get("/profil", authenticateToken, async (req, res) => {
  const userId = req.user.id;

  try {
    const result = await executeQuery(
      `SELECT 
          u.id_utilizator,
          u.username,
          u.email,
          u.phone,
          u.experience,
          u.tip_utilizator,
          u.imagine_profil,
          u.cv_url,
          u.subscriptie_cv,
          u.subscriptie_recomandari,
          u.subscriptie_angajatori,
          o.id_oras AS location_id,
          o.denumire_oras AS location
       FROM Utilizator u
       LEFT JOIN Oras o ON u.location = o.id_oras
       WHERE u.id_utilizator = :id`,
      { id: userId },
    );

    if (result.length === 0) {
      return res.status(404).json({ message: "Utilizatorul nu a fost găsit." });
    }

    const user = result[0];

    res.json({
      id: user.ID_UTILIZATOR,
      username: user.USERNAME,
      email: user.EMAIL,
      phone: user.PHONE,
      experience: user.EXPERIENCE,
      location: user.LOCATION,
      location_id: user.LOCATION_ID,
      role: user.TIP_UTILIZATOR,
      imagine_profil: user.IMAGINE_PROFIL,
      cv_url: user.CV_URL,
      subscriptie_cv: user.SUBSCRIPTIE_CV,
      subscriptie_recomandari: user.SUBSCRIPTIE_RECOMANDARI,
      subscriptie_angajatori: user.SUBSCRIPTIE_ANGAJATORI,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Eroare server." });
  }
});

// ================= UPDATE PROFILE =================
router.put("/update-profile", authenticateToken, async (req, res) => {
  const userId = req.user.id;
  const { username, email, phone, location, experience, imagine_profil } =
    req.body;

  try {
    if (username || email) {
      const existing = await executeQuery(
        `SELECT COUNT(*) AS COUNT 
         FROM Utilizator 
         WHERE (username = :username OR email = :email) 
         AND id_utilizator != :id`,
        { username, email, id: userId },
      );

      if (existing[0].COUNT > 0) {
        return res.status(400).json({
          message: "Username-ul sau email-ul este deja folosit.",
        });
      }
    }

    const updates = [];
    const params = { id: userId };

    if (username !== undefined) {
      updates.push("username = :username");
      params.username = username;
    }

    if (email !== undefined) {
      updates.push("email = :email");
      params.email = email;
    }

    if (phone !== undefined) {
      updates.push("phone = :phone");
      params.phone = phone;
    }

    if (location !== undefined) {
      updates.push("location = :location");
      params.location = location;
    }

    if (experience !== undefined) {
      updates.push("experience = :experience");
      params.experience = experience;
    }

    if (imagine_profil !== undefined) {
      updates.push("imagine_profil = :imagine_profil");
      params.imagine_profil = imagine_profil;
    }

    if (updates.length === 0) {
      return res.status(400).json({
        message: "Nicio modificare de actualizat.",
      });
    }

    const sql = `
      UPDATE Utilizator 
      SET ${updates.join(", ")} 
      WHERE id_utilizator = :id
    `;

    await executeQuery(sql, params, { autoCommit: true });

    const result = await executeQuery(
      `SELECT 
      u.id_utilizator,
      u.username,
      u.email,
      u.phone,
      u.experience,
      u.tip_utilizator,
      u.imagine_profil,
      u.cv_url,
      u.subscriptie_cv,
      u.subscriptie_recomandari,
      u.subscriptie_angajatori,
      o.id_oras AS location_id,
      o.denumire_oras AS location
   FROM Utilizator u
   LEFT JOIN Oras o ON u.location = o.id_oras
   WHERE u.id_utilizator = :id`,
      { id: userId },
    );

    const updatedUser = result[0];

    res.json({
      message: "Profil actualizat cu succes.",
      user: {
        id: updatedUser.ID_UTILIZATOR,
        username: updatedUser.USERNAME,
        email: updatedUser.EMAIL,
        phone: updatedUser.PHONE,
        experience: updatedUser.EXPERIENCE,
        location: updatedUser.LOCATION,
        location_id: updatedUser.LOCATION_ID,
        role: updatedUser.TIP_UTILIZATOR,
        imagine_profil: updatedUser.IMAGINE_PROFIL,
        cv_url: updatedUser.CV_URL,
        subscriptie_cv: updatedUser.SUBSCRIPTIE_CV,
        subscriptie_recomandari: updatedUser.SUBSCRIPTIE_RECOMANDARI,
        subscriptie_angajatori: updatedUser.SUBSCRIPTIE_ANGAJATORI,
      },
    });
  } catch (err) {
    console.error("Eroare update-profile:", err);
    res.status(500).json({ message: "Eroare server." });
  }
});

module.exports = router;
