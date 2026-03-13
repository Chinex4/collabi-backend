const emailVerificationTemplate = ({ name, otp }) => `
  <h2>Welcome ${name}</h2>
  <p>Use the OTP below to verify your email address.</p>
  <h1>${otp}</h1>
  <p>This OTP expires in 10 minutes.</p>
`;

const passwordResetTemplate = ({ name, otp }) => `
  <h2>Password Reset</h2>
  <p>Hello ${name}, use the OTP below to reset your password.</p>
  <h1>${otp}</h1>
  <p>This OTP expires in 10 minutes.</p>
`;

module.exports = {
  emailVerificationTemplate,
  passwordResetTemplate
};
