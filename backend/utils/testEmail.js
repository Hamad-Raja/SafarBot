require("dotenv").config({ path: require("path").join(__dirname, "..", ".env") });
const { sendEmail } = require("./mailer");

(async () => {
  try {
    const to = process.env.GMAIL_USER; // send to yourself for test
    const info = await sendEmail({
      to,
      subject: "SafarBot SMTP Test ✅",
      text: "If you got this email, SMTP is working.",
    });
    console.log("✅ Email sent:", info.messageId);
  } catch (e) {
    console.error("❌ Email failed:", e.message);
    process.exit(1);
  }
})();