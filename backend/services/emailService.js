const { Resend } = require("resend");

const resend = new Resend(process.env.RESEND_API_KEY);

async function sendResetEmail({ to, utorid, resetToken }) {
  try {
    console.log(to, utorid, resetToken);

    console.log("RESEND API KEY:", process.env.RESEND_API_KEY);

    
    const { data, error } = await resend.emails.send({
      from: "LoyaLog <onboarding@resend.dev>",
      to: ['heibaihaiermao@gmail.com'],
      subject: "Reset your password - LoyaLog",
      html: `
        <p>Hello ${utorid},</p>
        <p>You requested a password reset.</p>
        <p>Your reset token is: ${resetToken}.</p>
      `
    });

    console.log(data);

  } catch (err) {
    console.error("Failed to send reset email:", err);
    throw err;
  }
}

module.exports = sendResetEmail;
