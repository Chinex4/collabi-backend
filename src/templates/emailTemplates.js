const emailVerificationTemplate = ({ name, verificationLink }) => `
  <h2>Welcome ${name}</h2>
  <p>Please verify your email address by clicking the link below.</p>
  <p><a href="${verificationLink}">Verify Email</a></p>
`;

const passwordResetTemplate = ({ name, resetLink }) => `
  <h2>Password Reset</h2>
  <p>Hello ${name}, click the link below to reset your password.</p>
  <p><a href="${resetLink}">Reset Password</a></p>
`;

module.exports = {
  emailVerificationTemplate,
  passwordResetTemplate
};
