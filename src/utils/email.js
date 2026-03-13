const transporter = require("../config/mail");

const sendEmail = async ({ to, subject, html, text }) => {
  if (!to) return;

  await transporter.sendMail({
    from: process.env.EMAIL_FROM,
    to,
    subject,
    html,
    text
  });
};

module.exports = {
  sendEmail
};
