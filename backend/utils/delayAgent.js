const RouteM = require("../models/RouteM");
const Booking = require("../models/Booking");

const { getRouteMetrics } = require("./maps");
const { getWeather } = require("./weather");
const { predictDelay } = require("./predictorClient");

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

async function runDelayAgent({ onlyActive = true } = {}) {
  const threshold = parseFloat(process.env.DELAY_THRESHOLD_MINUTES || "10");

  const routes = await RouteM.find(onlyActive ? { active: true } : {}).lean();

  let processed = 0;
  let risky = 0;
  let failed = 0;
  const errors = [];
  const results = [];

  for (const r of routes) {
    try {
      processed++;

      const { distanceKm = 0, durationMin = 0 } = await getRouteMetrics({
        fromCity: r.fromCity,
        toCity: r.toCity,
        fromLat: r.fromLat,
        fromLng: r.fromLng,
        toLat: r.toLat,
        toLng: r.toLng,
      });

      const w = await getWeather({
        lat: r.fromLat,
        lng: r.fromLng,
        city: r.fromCity,
      });

      const departureHour = parseHour(r.departureTime);

      const pred = await predictDelay({
        operator: r.operator || "unknown",
        bus_type: r.busType || "unknown",
        from_city: r.fromCity || "unknown",
        to_city: r.toCity || "unknown",
        distance_km: Number(distanceKm || 0),
        planned_duration_min: Number(durationMin || 0),
        departure_hour: departureHour,
        temp_c: Number(w?.tempC ?? 0),
        humidity: Number(w?.humidity ?? 0),
        wind_ms: Number(w?.windMs ?? 0),
        condition: w?.condition || "Unknown",
        rain_mm: Number(w?.rainMm ?? 0),
        traffic_index: Number(r?.trafficIndex ?? 0),
        travel_date: r.travelDate || null,
        price: Number(r.price || 0),
      });

      const delayMin = Number(
        pred?.delay_minutes ?? pred?.predicted_delay_minutes ?? 0
      );

      const bookingQuery = {
        $or: [{ route: r._id }, { routeId: r.routeId || r._id.toString() }],
      };

      if (r.travelDate) {
        bookingQuery.travelDate = r.travelDate;
      }

      const confirmedBookings = await Booking.countDocuments({
        ...bookingQuery,
        status: "CONFIRMED",
      });

      const item = {
        route: {
          _id: r._id,
          routeId: r.routeId || r._id.toString(),
          operator: r.operator || "",
          busName: r.busName || "",
          busType: r.busType || "",
          fromCity: r.fromCity || "",
          toCity: r.toCity || "",
          travelDate: r.travelDate || "",
          departureTime: r.departureTime || "",
          price: Number(r.price || 0),
          active: !!r.active,
        },
        prediction: {
          delay_minutes: delayMin,
          will_delay: delayMin >= threshold,
          threshold_minutes: threshold,
        },
        weather: {
          tempC: Number(w?.tempC ?? 0),
          humidity: Number(w?.humidity ?? 0),
          windMs: Number(w?.windMs ?? 0),
          condition: w?.condition || "Unknown",
          rainMm: Number(w?.rainMm ?? 0),
        },
        maps: {
          distanceKm: Number(distanceKm || 0),
          durationMin: Number(durationMin || 0),
        },
        confirmedBookings,
      };

      if (delayMin >= threshold) {
        risky++;
      }

      results.push(item);
    } catch (err) {
      failed++;
      errors.push({
        routeId: r?._id?.toString?.() || null,
        fromCity: r?.fromCity || null,
        toCity: r?.toCity || null,
        error: err.message,
      });
    }
  }

  return { processed, risky, failed, threshold, results, errors };
}

module.exports = { runDelayAgent };