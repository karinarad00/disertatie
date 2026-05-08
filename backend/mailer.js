const nodemailer = require("nodemailer");

// Transporter
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: Number(process.env.EMAIL_PORT),
  secure: Number(process.env.EMAIL_PORT) === 465,
  auth: {
    user: process.env.ADMIN_EMAIL,
    pass: process.env.EMAIL_PASS,
  },
});

// Verify SMTP
transporter.verify((error, success) => {
  if (error) console.error("Eroare SMTP:", error);
  else console.log("Conexiune SMTP funcțională:", success);
});

// Reusable styles (email-safe)
const styles = {
  container: "font-family: Arial, sans-serif; color:#333; line-height:1.6;",
  title: "font-size:18px; font-weight:bold; margin-bottom:10px;",
  btnPrimary:
    "display:inline-block;padding:10px 16px;background:#28a745;color:#fff;text-decoration:none;border-radius:6px;",
  btnDanger:
    "display:inline-block;padding:10px 16px;background:#dc3545;color:#fff;text-decoration:none;border-radius:6px;",
  btnBlue:
    "display:inline-block;padding:10px 16px;background:#007bff;color:#fff;text-decoration:none;border-radius:6px;",
  card: "background:#f9f9f9;padding:12px;border-radius:6px;margin:10px 0;border:1px solid #eee;",
};

// RESET PASSWORD
async function sendResetEmail(toEmail, resetLink) {
  const mailOptions = {
    from: `"JobFinder" <${process.env.ADMIN_EMAIL}>`,
    to: toEmail,
    subject: "Resetare parolă",
    html: `
      <div style="${styles.container}">
        <p style="${styles.title}">Resetare parolă</p>
        <p>Ai solicitat resetarea parolei. Apasă butonul de mai jos:</p>

        <p>
          <a href="${resetLink}" style="${styles.btnBlue}">
            Resetează parola
          </a>
        </p>

        <p style="font-size:12px;color:#777;">
          Dacă nu ai solicitat acest lucru, ignoră acest email.
        </p>
      </div>
    `,
  };

  await transporter.sendMail(mailOptions);
}

// EMPLOYER REQUEST CONFIRMATION
async function sendEmployerRequestEmail(toEmail, contactName) {
  const mailOptions = {
    from: `"JobFinder" <${process.env.ADMIN_EMAIL}>`,
    to: toEmail,
    subject: "Cerere cont angajator înregistrată",
    html: `
      <div style="${styles.container}">
        <p style="${styles.title}">
          Bună${contactName ? `, ${contactName}` : ""} 👋
        </p>

        <p>
          Cererea ta pentru un cont de angajator a fost înregistrată cu succes și se află în curs de aprobare.
        </p>

        <div style="${styles.card}">
          Vei primi un răspuns în cel mai scurt timp.
        </div>

        <p>Mulțumim!</p>
      </div>
    `,
  };

  await transporter.sendMail(mailOptions);
}

// ADMIN NOTIFICATION (IMPORTANT: FIXED LAYOUT)
async function sendAdminNotificationEmail(adminEmail, cerereInfo) {
  const {
    id_cerere,
    denumire_companie,
    email,
    nume_contact,
    telefon,
    descriere,
  } = cerereInfo;

  const approvalLink = `http://localhost:3000/cerere/${id_cerere}/aproba`;
  const rejectionLink = `http://localhost:3000/cerere/${id_cerere}/respinge`;

  const mailOptions = {
    from: `"JobFinder" <${process.env.ADMIN_EMAIL}>`,
    to: adminEmail,
    subject: "Cerere nouă angajator în platformă",
    html: `
      <div style="${styles.container}">
        <p style="${styles.title}">Nouă cerere de angajator</p>

        <div style="${styles.card}">
          <p><strong>Companie:</strong> ${denumire_companie}</p>
          <p><strong>Nume contact:</strong> ${nume_contact || "-"}</p>
          <p><strong>Email:</strong> ${email}</p>
          <p><strong>Telefon:</strong> ${telefon || "-"}</p>
          <p><strong>Descriere:</strong> ${descriere || "-"}</p>
        </div>

        <table role="presentation" cellspacing="0" cellpadding="0">
          <tr>
            <td style="padding-right:10px;">
              <a href="${approvalLink}" style="${styles.btnPrimary}">
                Aprobă
              </a>
            </td>
            <td>
              <a href="${rejectionLink}" style="${styles.btnDanger}">
                Respinge
              </a>
            </td>
          </tr>
        </table>
      </div>
    `,
  };

  await transporter.sendMail(mailOptions);
}

// DECISION EMAIL
async function sendEmployerDecisionEmail(toEmail, status, motiv) {
  const isApproved = status === "approved";

  const mailOptions = {
    from: `"JobFinder" <${process.env.ADMIN_EMAIL}>`,
    to: toEmail,
    subject: `Cererea ta a fost ${isApproved ? "aprobată" : "respinsă"}`,
    html: `
      <div style="${styles.container}">
        <p style="${styles.title}">
          Cerere ${isApproved ? "aprobată 🎉" : "respinsă"}
        </p>

        <p>
          Cererea ta de cont angajator a fost
          <strong>${isApproved ? "aprobată" : "respinsă"}</strong>.
        </p>

        ${
          motiv
            ? `<div style="${styles.card}">
                <strong>Motiv:</strong><br/>${motiv}
               </div>`
            : ""
        }

        <p>Îți mulțumim pentru interes!</p>
      </div>
    `,
  };

  await transporter.sendMail(mailOptions);
}

// SET PASSWORD EMAIL
async function sendSetPasswordEmail(toEmail, setPasswordLink) {
  const mailOptions = {
    from: `"JobFinder" <${process.env.ADMIN_EMAIL}>`,
    to: toEmail,
    subject: "Cont angajator aprobat - setează parola",
    html: `
      <div style="${styles.container}">
        <p style="${styles.title}">Cont aprobat ✔</p>

        <p>
          Contul tău de angajator a fost aprobat. Pentru activare, setează parola:
        </p>

        <p>
          <a href="${setPasswordLink}" style="${styles.btnBlue}">
            Setează parola
          </a>
        </p>

        <p style="font-size:12px;color:#777;">
          Linkul este valabil pentru o perioadă limitată.
        </p>
      </div>
    `,
  };

  await transporter.sendMail(mailOptions);
}

module.exports = {
  sendResetEmail,
  sendEmployerRequestEmail,
  sendAdminNotificationEmail,
  sendEmployerDecisionEmail,
  sendSetPasswordEmail,
};
