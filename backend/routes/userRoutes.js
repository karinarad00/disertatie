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

// ================= REGISTER =================
router.post("/register", async (req, res) => {
  const { username, email, password } = req.body;

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
        id_utilizator, username, email, parola, tip_utilizator
      ) VALUES (
        seq_utilizator.NEXTVAL, :username, :email, :password, 'Candidat'
      )`,
      { username, email, password: hashedPassword },
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
      `SELECT id_utilizator, username, email, parola, tip_utilizator, imagine_profil, cv_url, id_companie, subscriptie_cv, subscriptie_recomandari, subscriptie_angajatori
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
    );

    await executeQuery(`DELETE FROM reset_tokens WHERE token = :token`, {
      token,
    });

    res.json({ message: "Parolă schimbată." });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Eroare server." });
  }
});

// ================= PROFIL =================
router.get("/profil", authenticateToken, async (req, res) => {
  const userId = req.user.id;

  try {
    const result = await executeQuery(
      `SELECT id_utilizator, username, email, tip_utilizator, imagine_profil, cv_url,
              subscriptie_cv, subscriptie_recomandari, subscriptie_angajatori
       FROM Utilizator
       WHERE id_utilizator = :id`,
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

module.exports = router;
