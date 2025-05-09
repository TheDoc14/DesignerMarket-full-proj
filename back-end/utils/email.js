const nodemailer = require('nodemailer');

async function sendVerificationEmail(to, token) {
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: +process.env.SMTP_PORT,
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS
    }
  });

  const link = `${process.env.CLIENT_URL}/verify-email?token=${token}`;
  await transporter.sendMail({
    from: `"DesignerMarket" <${process.env.SMTP_FROM}>`,
    to,
    subject: 'אימות כתובת אימייל',
    html: `<p>לחצו על הקישור כדי לאמת את כתובת המייל שלכם:</p>
           <a href="${link}">${link}</a>`
  });
}

module.exports = { sendVerificationEmail };
