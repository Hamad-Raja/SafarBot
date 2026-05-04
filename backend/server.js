const express = require("express");
const path = require("path");
const cors = require("cors");
const dotenv = require("dotenv");
const helmet = require("helmet");
const morgan = require("morgan");
const rateLimit = require("express-rate-limit");

const connectDB = require("./config/db");

dotenv.config();

const authRoutes = require("./routes/authRoutes");
const bookingRoutes = require("./routes/bookingRoutes");
const paymentRoutes = require("./routes/paymentRoutes");
const routeRoutes = require("./routes/routeRoutes");
const adminRoutes = require("./routes/adminRoutes");
const chatRoutes = require("./routes/chatRoutes");
const voiceRoutes = require("./routes/voiceRoutes");
const chatHistoryRoutes = require("./routes/chatHistoryRoutes");
const fraudAlertRoutes = require("./routes/fraudAlertRoutes");
const insightsRoutes = require("./routes/insightsRoutes");

const app = express();
const PORT = process.env.PORT || 5001;

app.set("trust proxy", 1);

const allowedOrigins = (
  process.env.CORS_ORIGIN ||
  "http://localhost:5173,http://localhost:3000,https://safar-bot.vercel.app"
)
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

app.use(
  cors({
    origin(origin, callback) {
      // allow server-to-server tools / curl / postman with no origin
      if (!origin) return callback(null, true);

      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      return callback(new Error("CORS not allowed for this origin."));
    },
    credentials: true,
  })
);

app.use(
  helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
  })
);
app.use(morgan(process.env.NODE_ENV === "production" ? "combined" : "dev"));

app.use(
  rateLimit({
    windowMs: 15 * 60 * 1000,
    max: Number(process.env.RATE_LIMIT_MAX || 300),
    standardHeaders: true,
    legacyHeaders: false,
    message: { message: "Too many requests. Please try again later." },
  })
);

app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true, limit: "1mb" }));

app.use(
  "/uploads",
  (req, res, next) => {
    const origin = req.headers.origin;

    if (allowedOrigins.includes(origin)) {
      res.setHeader("Access-Control-Allow-Origin", origin);
    }

    res.setHeader("Cross-Origin-Resource-Policy", "cross-origin");
    next();
  },
  express.static(path.join(process.cwd(), "uploads"))
);

connectDB();

app.get("/", (req, res) => {
  res.send("SafarBot API is running");
});

app.get("/health", (req, res) => {
  res.status(200).json({
    ok: true,
    service: "SafarBot backend",
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    env: process.env.NODE_ENV || "development",
  });
});

app.use("/api/auth", authRoutes);
app.use("/api/bookings", bookingRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/routes", routeRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/chat", chatRoutes);
app.use("/api/voice", voiceRoutes);
app.use("/api/chat-history", chatHistoryRoutes);
app.use("/api/fraud-alerts", fraudAlertRoutes);
app.use("/api/insights", insightsRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ message: "Route not found." });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error("Global error handler:", err.message);

  if (err.message && err.message.includes("CORS")) {
    return res.status(403).json({ message: err.message });
  }

  return res.status(err.status || 500).json({
    message: err.message || "Something went wrong!",
  });
});

app.listen(PORT, () => {
  console.log(`SafarBot backend running on http://localhost:${PORT}`);
});
