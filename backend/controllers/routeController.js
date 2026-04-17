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

  // Provider ownership check
  if (req.user.role === "provider") {
    if (!route.provider) return false;
    return String(route.provider) === String(req.user._id);
  }

  return false;
};

// GET /api/routes?from=...&to=...&date=...&active=true
exports.getRoutes = async (req, res, next) => {
  try {
    const { from = "", to = "", date = "", active } = req.query;

    const q = {};

    if (from) q.fromCity = new RegExp(cleanString(from), "i");
    if (to) q.toCity = new RegExp(cleanString(to), "i");
    if (date) q.travelDate = cleanString(date);

    // active filter (optional)
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

// OPTIONAL: GET /api/routes/provider/my
exports.getMyProviderRoutes = async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    if (req.user.role !== "provider" && req.user.role !== "admin") {
      return res.status(403).json({ message: "Forbidden" });
    }

    const q =
      req.user.role === "admin" ? {} : { provider: req.user._id };

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
    const safeDepartureTime = cleanString(departureTime);

    if (!safeFromCity || !safeToCity || !safeDepartureTime) {
      return res
        .status(400)
        .json({ message: "fromCity, toCity, departureTime are required" });
    }

    const providerId =
      req.user.role === "provider" ? req.user._id : req.body.provider || null;

    const safeOperator =
      req.user.role === "provider"
        ? cleanString(req.user.companyName || operator || "")
        : cleanString(operator || "");

    const newRoute = await Route.create({
      routeId: cleanString(routeId || ""),
      provider: providerId,
      operator: safeOperator,
      busName: cleanString(busName || ""),
      busType: cleanString(busType || ""),
      fromCity: safeFromCity,
      toCity: safeToCity,
      travelDate: cleanString(travelDate || ""),
      departureTime: safeDepartureTime,
      arrivalTime: cleanString(arrivalTime || ""),
      duration: cleanString(duration || ""),
      availableSeats: parseNumber(availableSeats, 0),
      price: parseNumber(price, 0),
      active: parseBoolean(active, true),
      rating: parseNumber(rating, 0),
    });

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
        ].includes(key)
      ) {
        route[key] = cleanString(req.body[key]);
      }

      if (["availableSeats", "price", "rating"].includes(key)) {
        route[key] = parseNumber(req.body[key], route[key]);
      }

      if (key === "active") {
        route[key] = parseBoolean(req.body[key], route[key]);
      }
    }

    // Provider apna operator overwrite na kare by random payload
    if (req.user.role === "provider") {
      route.provider = req.user._id;
      route.operator = cleanString(req.user.companyName || route.operator || "");
    }

    if (!route.fromCity || !route.toCity || !route.departureTime) {
      return res
        .status(400)
        .json({ message: "fromCity, toCity, departureTime are required" });
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