const axios = require("axios");
const Stripe = require("stripe");
const Booking = require("../models/Booking");
const FraudAlert = require("../models/FraudAlert");
const Route = require("../models/RouteM");

const AI_SERVICE_URL =
  process.env.AI_SERVICE_URL ||
  process.env.FRAUD_SERVICE_URL ||
  process.env.FASTAPI_URL ||
  "http://127.0.0.1:8000";

const stripe = process.env.STRIPE_SECRET_KEY
  ? new Stripe(process.env.STRIPE_SECRET_KEY)
  : null;

const normalizeProviderKey = (value = "") =>
  String(value || "").trim().toLowerCase();

const normalizeDecision = (value = "") => {
  const decision = String(value || "").toUpperCase();

  if (decision === "BLOCK" || decision === "BLOCKED") return "BLOCK";
  if (decision === "REVIEW") return "REVIEW";
  return "ALLOW";
};

const getSafeString = (value = "") => String(value || "").trim();

const getUniqueSeats = (seats = []) => {
  if (!Array.isArray(seats)) return [];
  return [...new Set(seats.map((seat) => String(seat).trim()).filter(Boolean))];
};

const parseSeatsFromMetadata = (value = "") => {
  try {
    const parsed = JSON.parse(value || "[]");
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

const releaseReservedSeats = async (routeId, seats = []) => {
  if (!routeId || !Array.isArray(seats) || seats.length === 0) return;

  await Route.updateOne(
    { _id: routeId },
    {
      $pull: { bookedSeats: { $in: seats } },
      $inc: { availableSeats: seats.length },
    }
  );
};

const createBooking = async (req, res) => {
  let reservedRoute = null;
  let reservedSeats = [];

  try {
    const {
      routeId: bodyRouteId,
      seats: bodySeats,
      travelDate: bodyTravelDate,
      sessionId,
      forceFraud, // dev test only
    } = req.body;

    if (!req.user) {
      return res.status(401).json({ message: "Unauthorized." });
    }

    let routeId = bodyRouteId;
    let seats = bodySeats;
    let travelDate = bodyTravelDate;
    let stripePayment = null;

    if (sessionId) {
      const safeSessionId = getSafeString(sessionId);
      const existingBooking = await Booking.findOne({ stripeSessionId: safeSessionId });

      if (existingBooking) {
        return res.status(200).json(existingBooking);
      }

      if (!stripe) {
        return res.status(500).json({ message: "Stripe is not configured." });
      }

      const checkoutSession = await stripe.checkout.sessions.retrieve(safeSessionId);

      if (!checkoutSession || checkoutSession.payment_status !== "paid") {
        return res.status(400).json({ message: "Stripe payment is not completed." });
      }

      const metadata = checkoutSession.metadata || {};

      if (metadata.userId && String(metadata.userId) !== String(req.user._id)) {
        return res.status(403).json({ message: "Payment session does not belong to this user." });
      }

      routeId = metadata.routeId || routeId;
      seats = parseSeatsFromMetadata(metadata.seats) || seats;
      travelDate = metadata.travelDate || travelDate;

      stripePayment = {
        provider: "stripe",
        status: "PAID",
        sessionId: checkoutSession.id,
        paymentIntentId: String(checkoutSession.payment_intent || ""),
        deviceId: metadata.deviceId || "",
      };
    }

    if (!routeId) {
      return res.status(400).json({ message: "Route ID is required." });
    }

    const uniqueSeats = getUniqueSeats(seats);

    if (uniqueSeats.length === 0) {
      return res
        .status(400)
        .json({ message: "At least one valid seat is required." });
    }

    // Request fingerprint data
    const deviceId = getSafeString(
      req.headers["x-device-id"] || stripePayment?.deviceId || ""
    );
    const userAgent = getSafeString(req.headers["user-agent"] || "");
    const forwardedFor = String(req.headers["x-forwarded-for"] || "");
    const ipAddress = getSafeString(
      forwardedFor ? forwardedFor.split(",")[0] : req.ip || ""
    );

    // 1) Check route exists / active
    const existingRoute = await Route.findById(routeId);

    if (!existingRoute) {
      return res.status(404).json({ message: "Route not found." });
    }

    if (existingRoute.active === false) {
      return res.status(400).json({ message: "This route is not active." });
    }

    const seatCount = uniqueSeats.length;
    reservedSeats = uniqueSeats;

    // 2) Atomically reserve seats
    reservedRoute = await Route.findOneAndUpdate(
      {
        _id: routeId,
        active: true,
        availableSeats: { $gte: seatCount },
        bookedSeats: { $nin: uniqueSeats },
      },
      {
        $addToSet: { bookedSeats: { $each: uniqueSeats } },
        $inc: { availableSeats: -seatCount },
      },
      { new: true }
    );

    if (!reservedRoute) {
      return res.status(400).json({
        message: "Selected seats are no longer available.",
      });
    }

    const operator = getSafeString(reservedRoute.operator || "");
    const from = getSafeString(reservedRoute.fromCity || "");
    const to = getSafeString(reservedRoute.toCity || "");
    const departureTime = getSafeString(reservedRoute.departureTime || "");
    const bookingTravelDate = getSafeString(
      travelDate || reservedRoute.travelDate || ""
    );
    const unitPrice = Number(reservedRoute.price || 0);
    const totalAmount = seatCount * unitPrice;

    const providerId = reservedRoute.provider || null;
    const providerKey = normalizeProviderKey(
      operator || req.user.companyName || ""
    );

    // 3) Create booking first as PENDING, but only with canonical DB values
    const booking = await Booking.create({
      user: req.user._id,
      route: reservedRoute._id,
      provider: providerId,
      deviceId,
      ipAddress,
      userAgent,
      routeId: String(reservedRoute._id),
      operator,
      from,
      to,
      departureTime,
      seats: uniqueSeats,
      seatCount,
      unitPrice,
      totalAmount,
      paymentProvider: stripePayment?.provider || "",
      paymentStatus: stripePayment?.status || "",
      stripeSessionId: stripePayment?.sessionId || "",
      stripePaymentIntentId: stripePayment?.paymentIntentId || "",
      travelDate: bookingTravelDate,
      status: stripePayment ? "CONFIRMED" : "PENDING",
    });

    if (stripePayment) {
      reservedRoute = null;
      reservedSeats = [];
      return res.status(201).json(booking);
    }

    // 4) DEV TEST HOOK (only in development)
    if (
      process.env.NODE_ENV === "development" &&
      (forceFraud === "REVIEW" || forceFraud === "BLOCK")
    ) {
      const forcedDecision = forceFraud === "BLOCK" ? "BLOCK" : "REVIEW";
      const status = forcedDecision === "BLOCK" ? "BLOCKED" : "REVIEW";

      booking.status = status;
      booking.fraud = {
        score: forcedDecision === "BLOCK" ? 85 : 55,
        decision: forcedDecision,
        reasons: ["FORCED_TEST_MODE"],
        rule_score: 60,
        ml_score: 40,
        ml_prob: 0.4,
        checkedAt: new Date(),
      };

      await booking.save();

      await FraudAlert.create({
        provider: providerId,
        providerKey,
        booking: booking._id,
        decision: forcedDecision,
        score: booking.fraud.score,
        reasons: booking.fraud.reasons,
      });

      await releaseReservedSeats(reservedRoute._id, uniqueSeats);
      reservedRoute = null;
      reservedSeats = [];

      return res.status(201).json(booking);
    }

    // 5) Build behavior features from DB
    const now = new Date();
    const oneMinAgo = new Date(now.getTime() - 60 * 1000);
    const tenMinAgo = new Date(now.getTime() - 10 * 60 * 1000);

    const [bookingsLast1Min, bookingsLast10Min] = await Promise.all([
      Booking.countDocuments({
        user: req.user._id,
        createdAt: { $gte: oneMinAgo },
        _id: { $ne: booking._id },
      }),
      Booking.countDocuments({
        user: req.user._id,
        createdAt: { $gte: tenMinAgo },
        _id: { $ne: booking._id },
      }),
    ]);

    const duplicateRouteFlag = await Booking.exists({
      user: req.user._id,
      from,
      to,
      travelDate: bookingTravelDate,
      _id: { $ne: booking._id },
    });

    const createdAt = req.user.createdAt ? new Date(req.user.createdAt) : null;
    const accountAgeDays = createdAt
      ? Math.max(0, Math.floor((now - createdAt) / (1000 * 60 * 60 * 24)))
      : 30;

    const hr = now.getHours();
    const nightBookingFlag = hr >= 1 && hr <= 5 ? 1 : 0;

    // Real same-device detection
    let sameDeviceFlag = 0;

    if (deviceId) {
      const sameDeviceOtherUser = await Booking.exists({
        deviceId,
        user: { $ne: req.user._id },
      });

      if (sameDeviceOtherUser) {
        sameDeviceFlag = 1;
      }
    }

    // Optional fallback using IP + User-Agent
    if (!sameDeviceFlag && ipAddress && userAgent) {
      const sameFingerprintOtherUser = await Booking.exists({
        ipAddress,
        userAgent,
        user: { $ne: req.user._id },
      });

      if (sameFingerprintOtherUser) {
        sameDeviceFlag = 1;
      }
    }

    const [totalUserBookings, cancelledBookings] = await Promise.all([
      Booking.countDocuments({ user: req.user._id }),
      Booking.countDocuments({
        user: req.user._id,
        status: "CANCELLED",
      }),
    ]);

    const cancellationHistoryRatio =
      totalUserBookings > 0 ? cancelledBookings / totalUserBookings : 0;

    // 6) Call fraud agent
    let fraudResult = null;

    try {
      const resp = await axios.post(
        `${AI_SERVICE_URL}/fraud/score`,
        {
          user_id: String(req.user._id),
          seats_count: seatCount,
          total_amount: Number(totalAmount || 0),
          bookings_last_1min: Number(bookingsLast1Min || 0),
          bookings_last_10min: Number(bookingsLast10Min || 0),
          same_device_flag: sameDeviceFlag,
          duplicate_route_flag: duplicateRouteFlag ? 1 : 0,
          account_age_days: accountAgeDays,
          night_booking_flag: nightBookingFlag,
          cancellation_history_ratio: Number(cancellationHistoryRatio || 0),
        },
        { timeout: 5000 }
      );

      fraudResult = resp.data;
    } catch (e) {
      console.error("Fraud service call failed:", e.message);

      fraudResult = {
        score: null,
        decision: "REVIEW",
        reasons: ["FRAUD_SERVICE_UNAVAILABLE"],
        rule_score: null,
        ml_score: null,
        ml_prob: null,
      };
    }

    // 7) Apply final decision
    let decision = normalizeDecision(fraudResult.decision);

    if (decision === "ALLOW" && (fraudResult.rule_score || 0) >= 40) {
      decision = "REVIEW";
    }

    let status = "CONFIRMED";
    if (decision === "REVIEW") status = "REVIEW";
    if (decision === "BLOCK") status = "BLOCKED";

    booking.status = status;
    booking.fraud = {
      score: fraudResult.score ?? null,
      decision,
      reasons: fraudResult.reasons || [],
      rule_score: fraudResult.rule_score ?? null,
      ml_score: fraudResult.ml_score ?? null,
      ml_prob: fraudResult.ml_prob ?? null,
      checkedAt: new Date(),
    };

    await booking.save();

    // REVIEW / BLOCK => release reserved seats
    if (status !== "CONFIRMED") {
      await releaseReservedSeats(reservedRoute._id, uniqueSeats);
      reservedRoute = null;
      reservedSeats = [];
    }

    // 8) Create alert for provider dashboard
    if (status === "REVIEW" || status === "BLOCKED") {
      await FraudAlert.create({
        provider: providerId,
        providerKey,
        booking: booking._id,
        decision: status === "BLOCKED" ? "BLOCK" : "REVIEW",
        score: booking.fraud.score ?? 0,
        reasons: booking.fraud.reasons || [],
      });
    }

    return res.status(201).json(booking);
  } catch (error) {
    console.error("createBooking error:", error);

    if (reservedRoute && reservedSeats.length) {
      try {
        await releaseReservedSeats(reservedRoute._id, reservedSeats);
      } catch (releaseError) {
        console.error("Seat release failed:", releaseError);
      }
    }

    return res.status(500).json({ message: "Unable to create booking." });
  }
};

const getMyBookings = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "Unauthorized." });
    }

    const bookings = await Booking.find({ user: req.user._id })
      .populate("route")
      .sort({
        createdAt: -1,
      });

    return res.json(bookings);
  } catch (error) {
    console.error("getMyBookings error:", error);
    return res.status(500).json({ message: "Unable to fetch bookings." });
  }
};

module.exports = { createBooking, getMyBookings };
