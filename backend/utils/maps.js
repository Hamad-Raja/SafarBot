const axios = require("axios");

async function getRouteMetrics({ fromCity, toCity, fromLat, fromLng, toLat, toLng }) {
  const key = process.env.GOOGLE_MAPS_API_KEY;
  if (!key) throw new Error("Missing GOOGLE_MAPS_API_KEY");

  // Prefer lat/lng if present, else use city strings
  const origin = (fromLat != null && fromLng != null) ? `${fromLat},${fromLng}` : fromCity;
  const destination = (toLat != null && toLng != null) ? `${toLat},${toLng}` : toCity;

  const url = "https://maps.googleapis.com/maps/api/directions/json";
  const { data } = await axios.get(url, {
    params: { origin, destination, key },
    timeout: 15000,
  });

  const route = data?.routes?.[0];
  const leg = route?.legs?.[0];
  if (!leg) {
    return { distanceKm: null, durationMin: null };
  }

  const distanceKm = (leg.distance.value || 0) / 1000;
  const durationMin = (leg.duration.value || 0) / 60;

  return { distanceKm, durationMin };
}

module.exports = { getRouteMetrics };