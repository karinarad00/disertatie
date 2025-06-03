const nodemailer = require("nodemailer");

// Inițializare transporter cu verificare SMTP
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: Number(process.env.EMAIL_PORT),
  secure: Number(process.env.EMAIL_PORT) === 465, // true doar dacă e port 465
  auth: {
    user: process.env.ADMIN_EMAIL,
    pass: process.env.EMAIL_PASS,
  },
});

// Verificare conexiune SMTP (opțional, dar util în dezvoltare)
transporter.verify((error, success) => {
  if (error) {
    console.error("Eroare SMTP:", error);
  } else {
    console.log("Conexiune SMTP funcțională:", success);
  }
});

// Email: Resetare parolă
async function sendResetEmail(toEmail, resetLink) {
  const mailOptions = {
    from: `"Platforma TA" <${process.env.ADMIN_EMAIL}>`,
    to: toEmail,
    subject: "Resetare parolă",
    text: `Ai solicitat resetarea parolei. Folosește acest link: ${resetLink}`,
    html: `
      <p>Bună,</p>
      <p>Ai solicitat resetarea parolei. Apasă pe linkul de mai jos pentru a-ți reseta parola:</p>
      <a href="${resetLink}">Resetează parola</a>
      <p>Dacă nu ai făcut tu această solicitare, ignoră acest mesaj.</p>
    `,
  };

  await transporter.sendMail(mailOptions);
}

// Email: Confirmare angajator
async function sendEmployerRequestEmail(toEmail, contactName) {
  const mailOptions = {
    from: `"Platforma TA" <${process.env.ADMIN_EMAIL}>`,
    to: toEmail,
    subject: "Cerere cont angajator înregistrată",
    text: `Cererea ta pentru un cont de angajator a fost înregistrată și se află în curs de aprobare.`,
    html: `
      <p>Bună${contactName ? `, ${contactName}` : ""},</p>
      <p>Cererea ta pentru un cont de angajator a fost înregistrată cu succes și se află în curs de aprobare.</p>
      <p>Vei primi un răspuns în cel mai scurt timp.</p>
      <p>Mulțumim!</p>
    `,
  };

  await transporter.sendMail(mailOptions);
}

// Email: Notificare către admin
async function sendAdminNotificationEmail(adminEmail, cerereInfo) {
  const { id_cerere, id_companie, email, nume_contact, telefon, descriere } =
    cerereInfo;

  const approvalLink = `http://localhost:3000/${id_cerere}/aproba`;
  const rejectionLink = `http://localhost:3000/${id_cerere}/respinge`;

  const mailOptions = {
    from: `"Platforma TA" <${process.env.ADMIN_EMAIL}>`,
    to: adminEmail,
    subject: "Cerere nouă angajator în platformă",
    text: `
      Cerere ID: ${id_cerere}
      Companie ID: ${id_companie}
      Nume contact: ${nume_contact || "-"}
      Email: ${email}
      Telefon: ${telefon || "-"}
      Descriere: ${descriere || "-"}
      Aprobare: ${approvalLink}
    `,
    html: `
      <p>A fost înregistrată o nouă cerere de cont angajator:</p>
      <ul>
        <li><strong>ID Cerere:</strong> ${id_cerere}</li>
        <li><strong>Companie ID:</strong> ${id_companie}</li>
        <li><strong>Nume contact:</strong> ${nume_contact || "-"}</li>
        <li><strong>Email:</strong> ${email}</li>
        <li><strong>Telefon:</strong> ${telefon || "-"}</li>
        <li><strong>Descriere:</strong> ${descriere || "-"}</li>
      </ul>
      <p>
        <a href="${approvalLink}" style="padding: 10px 15px; background-color: #28a745; color: white; text-decoration: none; border-radius: 5px;">
          Aprobă cererea
        </a>
        <a href="${rejectionLink}" style="padding: 10px 15px; color: white; background-color: red; text-decoration: none; border-radius: 4px;">Respinge cererea</a>
      </p>
    `,
  };

  await transporter.sendMail(mailOptions);
}

module.exports = {
  sendResetEmail,
  sendEmployerRequestEmail,
  sendAdminNotificationEmail,
};
