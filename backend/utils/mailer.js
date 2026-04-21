const nodemailer = require("nodemailer");

const MAILER_MODE = (process.env.MAILER_MODE || "mock").toLowerCase();

function isLiveMailer() {
  return MAILER_MODE === "live";
}

function createTransporter() {
  if (!isLiveMailer()) return null;

  const user = process.env.GMAIL_USER;
  const pass = process.env.GMAIL_APP_PASSWORD;

  if (!user || !pass) {
    throw new Error("Missing GMAIL_USER or GMAIL_APP_PASSWORD in .env");
  }

  return nodemailer.createTransport({
    service: "gmail",
    auth: {
      user,
      pass,
    },
  });
}

async function sendEmail({ to, subject, text, html }) {
  if (!to) {
    throw new Error("Recipient email is required");
  }

  if (!isLiveMailer()) {
    console.log("[MAILER MOCK] Email skipped:", {
      to,
      subject,
      text,
      html,
    });

    return {
      ok: true,
      mocked: true,
      to,
      subject,
    };
  }

  const transporter = createTransporter();

  const fromName = process.env.EMAIL_FROM_NAME || "SafarBot";
  const fromEmail = process.env.EMAIL_FROM || process.env.GMAIL_USER;

  const info = await transporter.sendMail({
    from: `${fromName} <${fromEmail}>`,
    to,
    subject,
    text,
    html,
  });

  return {
    ok: true,
    messageId: info.messageId,
    accepted: info.accepted,
    rejected: info.rejected,
    response: info.response,
  };
}

async function sendDelayEmail({ to, subject, text, html }) {
  if (String(process.env.ALERT_EMAIL_ENABLED || "true").toLowerCase() !== "true") {
    return {
      ok: true,
      skipped: true,
      reason: "ALERT_EMAIL_ENABLED is false",
    };
  }

  return sendEmail({ to, subject, text, html });
}

module.exports = {
  sendEmail,
  sendDelayEmail,
};