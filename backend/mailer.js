const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: Number(process.env.EMAIL_PORT),
  secure: false, // true pentru port 465, false pentru 587
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

async function sendResetEmail(toEmail, resetLink) {
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: toEmail,
    subject: "Resetare parolă",
    html: `
      <p>Bună,</p>
      <p>Ai solicitat resetarea parolei. Apasă pe linkul de mai jos pentru a-ți reseta parola:</p>
      <a href="${resetLink}">Resetează parola</a>
      <p>Dacă nu ai făcut tu această solicitare, ignoră acest mesaj.</p>
    `,
  };

  await transporter.sendMail(mailOptions);
}

async function sendEmployerRequestEmail(toEmail, contactName) {
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: toEmail,
    subject: "Cerere cont angajator înregistrată",
    html: `
      <p>Bună${contactName ? `, ${contactName}` : ""},</p>
      <p>Cererea ta pentru un cont de angajator a fost înregistrată cu succes și se află în curs de aprobare.</p>
      <p>Vei primi un răspuns în cel mai scurt timp.</p>
      <p>Mulțumim!</p>
    `,
  };

  await transporter.sendMail(mailOptions);
}

async function sendAdminNotificationEmail(adminEmail, cerereInfo) {
  const { id_cerere, id_companie, email, nume_contact, telefon, descriere } =
    cerereInfo;

  const approvalLink = `https://platforma-ta.ro/admin/cereri-angajatori/${id_cerere}`;

  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: adminEmail,
    subject: "Cerere nouă angajator în platformă",
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
