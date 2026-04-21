// backend/controllers/routeController.js
const Route = require("../models/RouteM");

const cleanString = (value = "") => String(value || "").trim();

const parseNumber = (value, defaultValue = 0) => {
  const num = Number(value);
  return Number.isFinite(num) ? num : defaultValue;
};

const parseBoolean = (value, defaultValue = true) => {
  if (typeof value === "boolean") return value;
  if (value === "true") return true;
  if (value === "false") return false;
  return defaultValue;
};

const isOwnerOrAdmin = (req, route) => {
  if (!req.user) return false;
  if (req.user.role === "admin") return true;

  if (req.user.role === "provider") {
    if (!route.provider) return false;
    return String(route.provider) === String(req.user._id);
  }

  return false;
};

// Converts time into "h:mm AM/PM"
// Supports:
// - "1:00 PM"
// - "01:00 pm"
// - "13:00"
// - "1:00"  -> assumed 24-hour style => 1:00 AM
function normalizeTimeToAmPm(value) {
  const raw = cleanString(value);
  if (!raw) return "";

  // already 12-hour with AM/PM
  const ampmMatch = raw.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
  if (ampmMatch) {
    let hour = parseInt(ampmMatch[1], 10);
    const minute = ampmMatch[2];
    const suffix = ampmMatch[3].toUpperCase();

    if (hour < 1 || hour > 12) return "";
    return `${hour}:${minute} ${suffix}`;
  }

  // 24-hour or plain HH:MM
  const hhmmMatch = raw.match(/^(\d{1,2}):(\d{2})$/);
  if (hhmmMatch) {
    let hour24 = parseInt(hhmmMatch[1], 10);
    const minute = hhmmMatch[2];

    if (hour24 < 0 || hour24 > 23) return "";

    const suffix = hour24 >= 12 ? "PM" : "AM";
    let hour12 = hour24 % 12;
    if (hour12 === 0) hour12 = 12;

    return `${hour12}:${minute} ${suffix}`;
  }

  return "";
}

// GET /api/routes?from=...&to=...&date=...&active=true
exports.getRoutes = async (req, res, next) => {
  try {
    const { from = "", to = "", date = "", active } = req.query;

    const q = {};

    if (from) q.fromCity = new RegExp(cleanString(from), "i");
    if (to) q.toCity = new RegExp(cleanString(to), "i");
    if (date) q.travelDate = cleanString(date);

    if (active === "true") q.active = true;
    if (active === "false") q.active = false;

    const routes = await Route.find(q).sort({ createdAt: -1 }).limit(200);
    return res.json(routes);
  } catch (e) {
    next(e);
  }
};

// GET /api/routes/:id
exports.getRouteById = async (req, res, next) => {
  try {
    const route = await Route.findById(req.params.id);
    if (!route) return res.status(404).json({ message: "Route not found" });
    return res.json(route);
  } catch (e) {
    next(e);
  }
};

// GET /api/routes/provider/my
exports.getMyProviderRoutes = async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    if (req.user.role !== "provider" && req.user.role !== "admin") {
      return res.status(403).json({ message: "Forbidden" });
    }

    const q = req.user.role === "admin" ? {} : { provider: req.user._id };

    const routes = await Route.find(q).sort({ createdAt: -1 });
    return res.json(routes);
  } catch (e) {
    next(e);
  }
};

// POST /api/routes
exports.createRoute = async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    if (req.user.role !== "provider" && req.user.role !== "admin") {
      return res.status(403).json({ message: "Forbidden" });
    }

    const {
      routeId,
      operator,
      busName,
      busType,
      fromCity,
      toCity,
      travelDate,
      departureTime,
      arrivalTime,
      duration,
      availableSeats,
      price,
      active,
      rating,
    } = req.body;

    const safeFromCity = cleanString(fromCity);
    const safeToCity = cleanString(toCity);
    const safeDepartureTime = normalizeTimeToAmPm(departureTime);
    const safeArrivalTime = normalizeTimeToAmPm(arrivalTime);

    if (!safeFromCity || !safeToCity || !safeDepartureTime) {
      return res.status(400).json({
        message:
          "fromCity, toCity, departureTime are required. Time must be like '1:00 PM' or '13:00'.",
      });
    }

    const providerId =
      req.user.role === "provider" ? req.user._id : req.body.provider || null;

    const safeOperator =
      req.user.role === "provider"
        ? cleanString(req.user.companyName || operator || "")
        : cleanString(operator || "");

    const newRoute = new Route({
      routeId: cleanString(routeId || ""),
      provider: providerId,
      operator: safeOperator,
      busName: cleanString(busName || ""),
      busType: cleanString(busType || ""),
      fromCity: safeFromCity,
      toCity: safeToCity,
      travelDate: cleanString(travelDate || ""),
      departureTime: safeDepartureTime,
      arrivalTime: safeArrivalTime,
      duration: cleanString(duration || ""),
      availableSeats: parseNumber(availableSeats, 0),
      price: parseNumber(price, 0),
      active: parseBoolean(active, true),
      rating: parseNumber(rating, 0),
    });

    // Auto-fill routeId if not provided
    if (!newRoute.routeId) {
      newRoute.routeId = String(newRoute._id);
    }

    await newRoute.save();

    return res.status(201).json(newRoute);
  } catch (e) {
    next(e);
  }
};

// PATCH /api/routes/:id
exports.updateRoute = async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const route = await Route.findById(req.params.id);
    if (!route) {
      return res.status(404).json({ message: "Route not found" });
    }

    if (!isOwnerOrAdmin(req, route)) {
      return res.status(403).json({ message: "Forbidden" });
    }

    const allowedFields = [
      "routeId",
      "operator",
      "busName",
      "busType",
      "fromCity",
      "toCity",
      "travelDate",
      "departureTime",
      "arrivalTime",
      "duration",
      "availableSeats",
      "price",
      "active",
      "rating",
    ];

    for (const key of allowedFields) {
      if (!(key in req.body)) continue;

      if (
        [
          "operator",
          "busName",
          "busType",
          "fromCity",
          "toCity",
          "travelDate",
          "duration",
        ].includes(key)
      ) {
        route[key] = cleanString(req.body[key]);
      }

      if (key === "departureTime") {
        const normalized = normalizeTimeToAmPm(req.body[key]);
        if (!normalized) {
          return res.status(400).json({
            message:
              "departureTime format invalid. Use '1:00 PM' or '13:00'.",
          });
        }
        route.departureTime = normalized;
      }

      if (key === "arrivalTime") {
        const rawArrival = cleanString(req.body[key]);
        if (rawArrival) {
          const normalized = normalizeTimeToAmPm(req.body[key]);
          if (!normalized) {
            return res.status(400).json({
              message:
                "arrivalTime format invalid. Use '1:00 PM' or '13:00'.",
            });
          }
          route.arrivalTime = normalized;
        } else {
          route.arrivalTime = "";
        }
      }

      if (key === "routeId") {
        const safeRouteId = cleanString(req.body[key]);
        if (safeRouteId) {
          route.routeId = safeRouteId;
        }
      }

      if (["availableSeats", "price", "rating"].includes(key)) {
        route[key] = parseNumber(req.body[key], route[key]);
      }

      if (key === "active") {
        route[key] = parseBoolean(req.body[key], route[key]);
      }
    }

    if (req.user.role === "provider") {
      route.provider = req.user._id;
      route.operator = cleanString(req.user.companyName || route.operator || "");
    }

    if (!route.fromCity || !route.toCity || !route.departureTime) {
      return res.status(400).json({
        message: "fromCity, toCity, departureTime are required",
      });
    }

    // Ensure routeId never stays empty
    if (!route.routeId) {
      route.routeId = String(route._id);
    }

    await route.save();
    return res.json(route);
  } catch (e) {
    next(e);
  }
};

// DELETE /api/routes/:id
exports.deleteRoute = async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const route = await Route.findById(req.params.id);
    if (!route) {
      return res.status(404).json({ message: "Route not found" });
    }

    if (!isOwnerOrAdmin(req, route)) {
      return res.status(403).json({ message: "Forbidden" });
    }

    await route.deleteOne();
    return res.json({ ok: true });
  } catch (e) {
    next(e);
  }
};