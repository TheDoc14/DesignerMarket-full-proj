// back-end/utils/email.utils.js
const nodemailer = require('nodemailer');

const createTransporter = () => {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT),
    secure: String(process.env.SMTP_SECURE).toLowerCase() === 'true',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
};

/**
 *  send confirmation email
 */
const sendVerificationEmail = async (to, token) => {
  const transporter = createTransporter();
  const link = `${process.env.CLIENT_URL}/verify-email?token=${token}`;

  await transporter.sendMail({
    from: `"DesignerMarket" <${process.env.SMTP_FROM}>`,
    to,
    subject: 'אימות כתובת אימייל',
    html: `<p>לחצו על הקישור כדי לאמת את כתובת המייל שלכם:</p>
           <a href="${link}">${link}</a>`,
  });
};

/**
 * 🔁 Reset password email
 */
const sendResetPasswordEmail = async (to, token) => {
  const transporter = createTransporter();
  const link = `${process.env.CLIENT_URL}/reset-password?token=${token}`;

  await transporter.sendMail({
    from: `"DesignerMarket" <${process.env.SMTP_FROM}>`,
    to,
    subject: 'איפוס סיסמה',
    html: `<p>קיבלנו בקשה לאיפוס סיסמה.</p>
           <p>אם זה היית אתה, לחץ כאן כדי לבחור סיסמה חדשה (הלינק תקף לזמן מוגבל):</p>
           <a href="${link}">${link}</a>
           <p>אם לא ביקשת איפוס – אפשר להתעלם מהמייל.</p>`,
  });
};

module.exports = { sendVerificationEmail, sendResetPasswordEmail };
