import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT || 587),
  secure: Number(process.env.SMTP_PORT || 587) === 465,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

const FROM = process.env.EMAIL_FROM || "noreply@forge.app";

export async function sendOtpEmail(to: string, code: string) {
  await transporter.sendMail({
    from: FROM,
    to,
    subject: "Your Forge verification code",
    html: `
      <div style="font-family:system-ui,sans-serif;max-width:480px;margin:0 auto;padding:32px">
        <h2 style="color:#1a1a1a;font-size:20px;margin-bottom:8px">Verify your email</h2>
        <p style="color:#555;font-size:14px;line-height:1.6">
          Use the code below to verify your Forge account. It expires in 10 minutes.
        </p>
        <div style="background:#f5f5f5;border-radius:8px;padding:16px;text-align:center;margin:24px 0">
          <span style="font-size:32px;font-weight:bold;letter-spacing:6px;color:#1a1a1a">${code}</span>
        </div>
        <p style="color:#999;font-size:12px">
          If you didn't create a Forge account, you can safely ignore this email.
        </p>
      </div>
    `,
  });
}

export async function sendPasswordResetEmail(to: string, resetUrl: string) {
  await transporter.sendMail({
    from: FROM,
    to,
    subject: "Reset your Forge password",
    html: `
      <div style="font-family:system-ui,sans-serif;max-width:480px;margin:0 auto;padding:32px">
        <h2 style="color:#1a1a1a;font-size:20px;margin-bottom:8px">Reset your password</h2>
        <p style="color:#555;font-size:14px;line-height:1.6">
          Click the button below to reset your Forge password. This link expires in 1 hour.
        </p>
        <a href="${resetUrl}" style="display:inline-block;background:#1a1a1a;color:#fff;padding:12px 32px;border-radius:8px;text-decoration:none;font-weight:600;font-size:14px;margin:24px 0">
          Reset Password
        </a>
        <p style="color:#999;font-size:12px">
          If you didn't request a password reset, you can safely ignore this email.
        </p>
      </div>
    `,
  });
}
