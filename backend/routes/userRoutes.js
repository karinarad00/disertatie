const express = require("express");
const router = express.Router();
const oracledb = require("oracledb");
const bcrypt = require("bcrypt");
const crypto = require("crypto");
require("dotenv").config();
const {
  sendResetEmail,
  sendEmployerRequestEmail,
  sendAdminNotificationEmail,
  sendEmployerDecisionEmail
} = require("../mailer");

// Înregistrare utilizator
router.post("/register", async (req, res) => {
  const { username, email, password } = req.body;

  let connection;
  try {
    connection = await oracledb.getConnection();

    // Verifică dacă username-ul sau email-ul există deja
    const existing = await connection.execute(
      `SELECT COUNT(*) AS COUNT FROM Utilizator WHERE username = :username OR email = :email`,
      { username, email },
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );

    if (existing.rows[0].COUNT > 0) {
      return res
        .status(400)
        .json({ message: "Username-ul sau email-ul este deja folosit." });
    }

    // Criptează parola
    const hashedPassword = await bcrypt.hash(password, 10);

    // Inserează utilizatorul cu tipul Candidat
    await connection.execute(
      `INSERT INTO Utilizator (
          id_utilizator, username, email, parola, tip_utilizator
        ) VALUES (
          seq_utilizator.NEXTVAL, :username, :email, :password, 'Candidat'
        )`,
      { username, email, password: hashedPassword },
      { autoCommit: true }
    );

    res.status(201).json({ message: "Utilizator înregistrat cu succes." });
  } catch (error) {
    console.error("Eroare la înregistrare:", error);
    res.status(500).json({ message: "Eroare server." });
  } finally {
    if (connection) {
      try {
        await connection.close();
      } catch (err) {
        console.error("Eroare la închiderea conexiunii:", err);
      }
    }
  }
});

// Autentificare utilizator
router.post("/login", async (req, res) => {
  const { username, password } = req.body;

  let connection;
  try {
    connection = await oracledb.getConnection();

    const result = await connection.execute(
      `SELECT id_utilizator, username, email, parola, tip_utilizator, imagine_profil
       FROM Utilizator
       WHERE username = :username`,
      [username],
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );
    if (result.rows.length === 0) {
      return res.status(401).json({ message: "Utilizator inexistent." });
    }

    const user = result.rows[0];
    const parolaOk = await bcrypt.compare(password, user.PAROLA);

    if (!parolaOk) {
      return res.status(401).json({ message: "Parolă incorectă." });
    }

    res.json({
      id: user.ID_UTILIZATOR,
      username: user.USERNAME,
      email: user.EMAIL,
      role: user.TIP_UTILIZATOR,
      imagine_profil: user.IMAGINE_PROFIL,
    });
  } catch (error) {
    console.error("Eroare login:", error);
    res.status(500).json({ message: "Eroare server." });
  } finally {
    if (connection) {
      try {
        await connection.close();
      } catch (err) {
        console.error("Eroare la închiderea conexiunii:", err);
      }
    }
  }
});

router.post("/request-reset", async (req, res) => {
  const { email } = req.body;

  let connection;
  try {
    connection = await oracledb.getConnection();

    // Verifică dacă emailul există
    const userResult = await connection.execute(
      `SELECT id_utilizator FROM Utilizator WHERE email = :email`,
      [email],
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({ message: "Email inexistent." });
    }

    const userId = userResult.rows[0].ID_UTILIZATOR;

    // Generează token random + expirare (ex: 1h)
    const token = crypto.randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 oră

    // Salvează token în DB
    await connection.execute(
      `INSERT INTO reset_tokens (id_utilizator, token, expires_at) VALUES (:id_utilizator, :token, TO_TIMESTAMP(:expires_at, 'YYYY-MM-DD HH24:MI:SS'))`,
      {
        id_utilizator: userId,
        token: token,
        expires_at: expiresAt.toISOString().slice(0, 19).replace("T", " "),
      },
      { autoCommit: true }
    );

    // Creează link resetare (frontend rulează pe port 3000)
    const resetLink = `http://localhost:3000/change-password?token=${token}`;

    // Trimite email
    await sendResetEmail(email, resetLink);

    res.json({ message: "Instrucțiuni de resetare trimise pe email." });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Eroare server." });
  } finally {
    if (connection) {
      try {
        await connection.close();
      } catch {}
    }
  }
});

router.post("/reset-password", async (req, res) => {
  const { token, newPassword } = req.body;

  let connection;
  try {
    connection = await oracledb.getConnection();

    // Caută token valid (neexpirat)
    const tokenResult = await connection.execute(
      `SELECT id_utilizator, expires_at FROM reset_tokens WHERE token = :token`,
      [token],
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );

    if (tokenResult.rows.length === 0) {
      return res.status(400).json({ message: "Token invalid." });
    }

    const { ID_UTILIZATOR, EXPIRES_AT } = tokenResult.rows[0];

    if (new Date() > EXPIRES_AT) {
      return res.status(400).json({ message: "Token expirat." });
    }

    // Hash noua parolă
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Actualizează parola în Utilizator
    await connection.execute(
      `UPDATE Utilizator SET parola = :parola WHERE id_utilizator = :id_utilizator`,
      { parola: hashedPassword, id_utilizator: ID_UTILIZATOR },
      { autoCommit: true }
    );

    // Șterge tokenul după folosire
    await connection.execute(
      `DELETE FROM reset_tokens WHERE token = :token`,
      [token],
      { autoCommit: true }
    );

    res.json({ message: "Parolă schimbată cu succes." });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Eroare server." });
  } finally {
    if (connection) {
      try {
        await connection.close();
      } catch {}
    }
  }
});

// POST cerere angajator
router.post("/cereri-angajatori", async (req, res) => {
  const { id_companie, email, nume_contact, telefon, descriere } = req.body;

  if (!id_companie || !email) {
    return res
      .status(400)
      .json({ message: "Compania și email-ul sunt obligatorii." });
  }

  let connection;
  try {
    connection = await oracledb.getConnection();

    // Verifică dacă deja există o cerere cu același id_companie și email
    const existingRequest = await connection.execute(
      `SELECT COUNT(*) AS count FROM CereriAngajatori WHERE id_companie = :id_companie AND email = :email`,
      { id_companie, email },
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );

    if (existingRequest.rows[0].COUNT > 0) {
      return res.status(409).json({
        message: "Există deja o cerere pentru această companie și email.",
      });
    }

    // Continuă cu inserarea dacă nu există deja
    const seqResult = await connection.execute(
      `SELECT seq_cereri_angajatori.NEXTVAL AS nextId FROM dual`,
      [],
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );
    const nextId = seqResult.rows[0].NEXTID;

    await connection.execute(
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
      { autoCommit: true }
    );

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
  } finally {
    if (connection) {
      try {
        await connection.close();
      } catch (e) {
        console.error(e);
      }
    }
  }
});

// Aprobare cerere angajator
router.post("/cereri-angajatori/:id/aproba", async (req, res) => {
  const id_cerere = req.params.id;
  let connection;

  try {
    connection = await oracledb.getConnection();

    // Verifică dacă cererea există
    const result = await connection.execute(
      `SELECT * FROM CereriAngajatori WHERE id_cerere = :id`,
      [id_cerere],
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Cererea nu a fost găsită." });
    }

    // Actualizează statusul în "Aprobat"
    await connection.execute(
      `UPDATE CereriAngajatori SET status = 'Approved' WHERE id_cerere = :id`,
      [id_cerere],
      { autoCommit: true }
    );

    // Trimite emailul de decizie către angajator
    await sendEmployerDecisionEmail(
      result.rows[0].EMAIL,
      "approved"
    );

    res.json({ message: "Cererea a fost aprobată." });
  } catch (err) {
    console.error("Eroare la aprobarea cererii:", err);
    res.status(500).json({ message: "Eroare server." });
  } finally {
    if (connection) {
      try {
        await connection.close();
      } catch (e) {
        console.error(e);
      }
    }
  }
});

router.post("/cereri-angajatori/:id/respinge", async (req, res) => {
  const id_cerere = req.params.id;
  let connection;

  try {
    connection = await oracledb.getConnection();

    const result = await connection.execute(
      `SELECT * FROM CereriAngajatori WHERE id_cerere = :id`,
      [id_cerere],
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Cererea nu a fost găsită." });
    }

    await connection.execute(
      `UPDATE CereriAngajatori SET status = 'Rejected' WHERE id_cerere = :id`,
      [id_cerere],
      { autoCommit: true }
    );

    // Trimite emailul de decizie către angajator
    await sendEmployerDecisionEmail(
      result.rows[0].EMAIL,
      "rejected",
      req.body.motiv || "Cererea a fost respinsă fără un motiv specificat."
    );

    res.json({ message: "Cererea a fost respinsă." });
  } catch (err) {
    console.error("Eroare respingere:", err);
    res.status(500).json({ message: "Eroare server." });
  } finally {
    if (connection) await connection.close().catch(console.error);
  }
});

module.exports = router;
