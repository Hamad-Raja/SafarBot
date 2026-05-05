const express = require("express");
const Stripe = require("stripe");

const Route = require("../models/RouteM");
const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

const stripe = process.env.STRIPE_SECRET_KEY
  ? new Stripe(process.env.STRIPE_SECRET_KEY)
  : null;

const CLIENT_URL = (process.env.CLIENT_URL || "https://safar-bot.vercel.app").replace(
  /\/$/,
  ""
);

const USD_TO_PKR_RATE = Number(process.env.USD_TO_PKR_RATE || 280);

const getUniqueSeats = (seats = []) => {
  if (!Array.isArray(seats)) return [];
  return [...new Set(seats.map((seat) => String(seat).trim()).filter(Boolean))];
};

router.post("/create-checkout-session", protect, async (req, res) => {
  try {
    if (!stripe) {
      return res.status(500).json({ message: "Stripe is not configured." });
    }

    const { routeId, seats, travelDate, amount } = req.body || {};
    const selectedSeats = getUniqueSeats(seats);

    if (!routeId) {
      return res.status(400).json({ message: "Route ID is required." });
    }

    if (selectedSeats.length === 0) {
      return res.status(400).json({ message: "At least one valid seat is required." });
    }

    const route = await Route.findById(routeId);

    if (!route) {
      return res.status(404).json({ message: "Route not found." });
    }

    if (route.active === false) {
      return res.status(400).json({ message: "This route is not active." });
    }

    const calculatedAmount = selectedSeats.length * Number(route.price || 0);
    const checkoutAmountPkr = Number(calculatedAmount || amount || 0);

    if (!Number.isFinite(checkoutAmountPkr) || checkoutAmountPkr <= 0) {
      return res.status(400).json({ message: "Invalid payment amount." });
    }

    if (!Number.isFinite(USD_TO_PKR_RATE) || USD_TO_PKR_RATE <= 0) {
      return res.status(500).json({ message: "Currency conversion is not configured." });
    }

    const checkoutAmountUsd = checkoutAmountPkr / USD_TO_PKR_RATE;
    const checkoutAmountUsdCents = Math.round(checkoutAmountUsd * 100);

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      mode: "payment",
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: `Bus Route Booking (${route._id})`,
            },
            unit_amount: checkoutAmountUsdCents,
          },
          quantity: 1,
        },
      ],
      success_url: `${CLIENT_URL}/payment-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${CLIENT_URL}/payment-failed`,
      metadata: {
        routeId: String(route._id),
        seats: JSON.stringify(selectedSeats),
        travelDate: String(travelDate || route.travelDate || ""),
        userId: String(req.user._id),
        deviceId: String(req.headers["x-device-id"] || ""),
        amountPkr: String(checkoutAmountPkr),
        amountUsd: checkoutAmountUsd.toFixed(2),
        usdToPkrRate: String(USD_TO_PKR_RATE),
      },
    });

    return res.json({
      url: session.url,
      amountPkr: checkoutAmountPkr,
      amountUsd: checkoutAmountUsd,
    });
  } catch (err) {
    console.error("Stripe checkout session failed:", err.message);
    return res.status(500).json({ message: "Stripe session failed." });
  }
});

module.exports = router;
