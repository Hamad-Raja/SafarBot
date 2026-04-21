const RouteM = require("../models/RouteM");
const Booking = require("../models/Booking");

const { getRouteMetrics } = require("../utils/maps");
const { getWeather } = require("../utils/weather");
const { predictDelay } = require("../utils/predictorClient");
const { runDelayAgent } = require("../utils/delayAgent");
const { sendEmail } = require("../utils/mailer");

function safeString(value = "") {
  return String(value || "").trim();
}

function safeNumber(value, fallback = 0) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function parseHour(departureTimeStr) {
  try {
    if (!departureTimeStr || typeof departureTimeStr !== "string") return null;

    const m = departureTimeStr.match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i);
    if (!m) return null;

    let h = parseInt(m[1], 10);
    const ampm = m[3].toUpperCase();

    if (ampm === "PM" && h !== 12) h += 12;
    if (ampm === "AM" && h === 12) h = 0;

    return h;
  } catch {
    return null;
  }
}

function parseDurationToMin(value) {
  if (value == null) return 0;

  const raw = String(value).trim();
  if (!raw) return 0;

  if (/^\d+(\.\d+)?$/.test(raw)) {
    return safeNumber(raw, 0);
  }

  const hhmm = raw.match(/^(\d{1,2}):(\d{2})$/);
  if (hhmm) {
    const h = parseInt(hhmm[1], 10);
    const m = parseInt(hhmm[2], 10);
    return h * 60 + m;
  }

  const hoursMatch = raw.match(/(\d+(?:\.\d+)?)\s*(h|hr|hrs|hour|hours)/i);
  const minsMatch = raw.match(/(\d+(?:\.\d+)?)\s*(m|min|mins|minute|minutes)/i);

  const hours = hoursMatch ? parseFloat(hoursMatch[1]) : 0;
  const mins = minsMatch ? parseFloat(minsMatch[1]) : 0;

  const total = hours * 60 + mins;
  return Number.isFinite(total) ? total : 0;
}

function buildBookingQuery(route) {
  const query = {
    $or: [{ route: route._id }, { routeId: route.routeId || route._id.toString() }],
  };

  if (route.travelDate) {
    query.travelDate = route.travelDate;
  }

  return query;
}

async function buildRouteInsights(routeDoc) {
  const route = routeDoc?.toObject ? routeDoc.toObject() : routeDoc;
  const warnings = [];

  let distanceKm = 0;
  let durationMin = parseDurationToMin(route.duration);
  let mapsSource = "fallback";

  try {
    const metrics = await getRouteMetrics({
      fromCity: route.fromCity,
      toCity: route.toCity,
      fromLat: route.fromLat,
      fromLng: route.fromLng,
      toLat: route.toLat,
      toLng: route.toLng,
    });

    if (metrics?.distanceKm != null) {
      distanceKm = safeNumber(metrics.distanceKm, 0);
    }

    if (metrics?.durationMin != null) {
      durationMin = safeNumber(metrics.durationMin, durationMin);
    }

    mapsSource = "google_maps";
  } catch (err) {
    warnings.push(`Maps unavailable: ${err.message}`);
  }

  let weather = {
    tempC: 0,
    humidity: 0,
    windMs: 0,
    condition: "Unknown",
    rainMm: 0,
    source: "fallback",
  };

  try {
    const w = await getWeather({
      lat: route.fromLat,
      lng: route.fromLng,
      city: route.fromCity,
    });

    weather = {
      tempC: safeNumber(w?.tempC, 0),
      humidity: safeNumber(w?.humidity, 0),
      windMs: safeNumber(w?.windMs, 0),
      condition: safeString(w?.condition || "Unknown"),
      rainMm: safeNumber(w?.rainMm, 0),
      source: "openweather",
    };
  } catch (err) {
    warnings.push(`Weather unavailable: ${err.message}`);
  }

  const payload = {
    operator: safeString(route.operator || "unknown"),
    bus_type: safeString(route.busType || "unknown"),
    from_city: safeString(route.fromCity || "unknown"),
    to_city: safeString(route.toCity || "unknown"),
    distance_km: safeNumber(distanceKm, 0),
    planned_duration_min: safeNumber(durationMin, 0),
    departure_hour: parseHour(route.departureTime),
    temp_c: safeNumber(weather.tempC, 0),
    humidity: safeNumber(weather.humidity, 0),
    wind_ms: safeNumber(weather.windMs, 0),
    condition: safeString(weather.condition || "Unknown"),
    rain_mm: safeNumber(weather.rainMm, 0),
    traffic_index: safeNumber(route.trafficIndex, 0),
    travel_date: safeString(route.travelDate || ""),
    price: safeNumber(route.price, 0),
  };

  let prediction = null;
  let status = "ok";

  try {
    prediction = await predictDelay(payload);
  } catch (err) {
    status = "partial";
    warnings.push(`AI prediction unavailable: ${err.message}`);
  }

  const bookingQuery = buildBookingQuery(route);

  const [totalBookings, pendingBookings, confirmedBookings] = await Promise.all([
    Booking.countDocuments(bookingQuery),
    Booking.countDocuments({ ...bookingQuery, status: "PENDING" }),
    Booking.countDocuments({ ...bookingQuery, status: "CONFIRMED" }),
  ]);

  return {
    status,
    route: {
      _id: route._id,
      routeId: route.routeId || "",
      operator: route.operator || "",
      busName: route.busName || "",
      busType: route.busType || "",
      fromCity: route.fromCity || "",
      toCity: route.toCity || "",
      travelDate: route.travelDate || "",
      departureTime: route.departureTime || "",
      arrivalTime: route.arrivalTime || "",
      duration: route.duration || "",
      availableSeats: safeNumber(route.availableSeats, 0),
      price: safeNumber(route.price, 0),
      active: !!route.active,
      rating: safeNumber(route.rating, 0),
      provider:
        route.provider && typeof route.provider === "object"
          ? {
              _id: route.provider._id || null,
              name: route.provider.name || "",
              email: route.provider.email || "",
              companyName: route.provider.companyName || "",
              role: route.provider.role || "",
            }
          : route.provider || null,
    },
    maps: {
      distanceKm: safeNumber(distanceKm, 0),
      durationMin: safeNumber(durationMin, 0),
      source: mapsSource,
    },
    weather,
    prediction,
    bookingStats: {
      totalBookings,
      pendingBookings,
      confirmedBookings,
    },
    warnings,
  };
}

const getRouteInsights = async (req, res) => {
  try {
    const route = await RouteM.findById(req.params.id).populate(
      "provider",
      "name email companyName role"
    );

    if (!route) {
      return res.status(404).json({ message: "Route not found." });
    }

    const insights = await buildRouteInsights(route);
    return res.json(insights);
  } catch (err) {
    console.error("getRouteInsights error:", err);
    return res.status(500).json({ message: "Unable to fetch route insights." });
  }
};

const runInsightsDelayAgent = async (req, res) => {
  try {
    const onlyActive =
      typeof req.body?.onlyActive === "boolean" ? req.body.onlyActive : true;

    const result = await runDelayAgent({ onlyActive });

    return res.json({
      ok: true,
      message: "Delay agent preview completed.",
      ...result,
    });
  } catch (err) {
    console.error("runInsightsDelayAgent error:", err);
    return res.status(500).json({
      message: "Unable to run delay agent.",
      error: err.message,
    });
  }
};

const sendRouteDelayAlert = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    if (req.user.role !== "provider" && req.user.role !== "admin") {
      return res.status(403).json({ message: "Forbidden" });
    }

    const route = await RouteM.findById(req.params.id).populate(
      "provider",
      "name email companyName role"
    );

    if (!route) {
      return res.status(404).json({ message: "Route not found." });
    }

    if (
      req.user.role === "provider" &&
      String(route.provider?._id || route.provider) !== String(req.user._id)
    ) {
      return res.status(403).json({ message: "Forbidden" });
    }

    const insights = await buildRouteInsights(route);

    if (!insights.prediction) {
      return res.status(400).json({
        message: "Prediction not available. Cannot send alert.",
        insights,
      });
    }

    const predictedDelay = Number(
      insights.prediction?.delay_minutes ??
      insights.prediction?.predicted_delay_minutes ??
      0
    );

    const threshold = Number(
      insights.prediction?.threshold_minutes ??
      process.env.DELAY_THRESHOLD_MINUTES ??
      10
    );

    if (predictedDelay < threshold) {
      return res.status(400).json({
        message: "Predicted delay is below threshold. Alert not sent.",
        predictedDelay,
        threshold,
      });
    }

    const bookingQuery = buildBookingQuery(route);

    const bookings = await Booking.find({
      ...bookingQuery,
      status: "CONFIRMED",
    }).populate("user").lean();

    if (!bookings.length) {
      return res.status(404).json({
        message: "No confirmed bookings found for this route.",
      });
    }

    let sent = 0;
    let failed = 0;
    const results = [];

    for (const b of bookings) {
      const email = b?.user?.email;

      if (!email) {
        failed++;
        results.push({
          bookingId: b?._id || null,
          email: null,
          status: "failed",
          error: "User email not found",
        });
        continue;
      }

      try {
        const result = await sendEmail({
          to: email,
          subject: `SafarBot Alert: Possible delay on ${route.fromCity} → ${route.toCity}`,
          text:
            `Your trip may be delayed.\n\n` +
            `Route: ${route.fromCity} → ${route.toCity}\n` +
            `Date: ${route.travelDate || b.travelDate || "N/A"}\n` +
            `Departure: ${route.departureTime || "N/A"}\n` +
            `Predicted delay: ~${Math.round(predictedDelay)} minutes\n` +
            `Weather: ${insights.weather?.condition || "Unknown"}\n\n` +
            `Please plan accordingly.\nSafarBot`,
        });

        sent++;
        results.push({
          bookingId: b?._id || null,
          email,
          status: "sent",
          result,
        });
      } catch (err) {
        failed++;
        results.push({
          bookingId: b?._id || null,
          email,
          status: "failed",
          error: err.message,
        });
      }
    }

    return res.json({
      ok: true,
      message: "Delay alert sending completed.",
      routeId: route._id,
      predictedDelay,
      threshold,
      totalBookings: bookings.length,
      sent,
      failed,
      results,
    });
  } catch (err) {
    console.error("sendRouteDelayAlert error:", err);
    return res.status(500).json({
      message: "Unable to send route delay alert.",
      error: err.message,
    });
  }
};

const testMail = async (req, res) => {
  try {
    const to = process.env.TEST_EMAIL_TO || process.env.GMAIL_USER;

    const result = await sendEmail({
      to,
      subject: "SafarBot test email",
      text: "This is a real email test from SafarBot backend.",
    });

    return res.json({
      ok: true,
      message: "Test email sent successfully.",
      result,
    });
  } catch (err) {
    console.error("testMail error:", err);
    return res.status(500).json({
      message: "Unable to send test email.",
      error: err.message,
    });
  }
};

module.exports = {
  getRouteInsights,
  runInsightsDelayAgent,
  sendRouteDelayAlert,
  testMail,
};