require("dotenv").config({ path: require("path").join(__dirname, "../.env") }); 
console.log("OPENWEATHER key loaded length:", (process.env.OPENWEATHER_API_KEY || "").length);
console.log("OPENWEATHER key starts with:", (process.env.OPENWEATHER_API_KEY || "").slice(0, 4));
console.log("ENV KEY LOADED?", !!process.env.GOOGLE_MAPS_API_KEY);
console.log("ENV FILE PATH:", require("path").join(__dirname, "../.env"));

const { getRouteMetrics } = require("./maps");
const { getWeatherByCity } = require("./weather");
const { predictDelay } = require("./predictorClient");

(async () => {
  const fromCity = "Islamabad";
  const toCity = "Lahore";

  const { distanceKm, durationMin } = await getRouteMetrics({ fromCity, toCity });
  const w = await getWeatherByCity(fromCity);

  const pred = await predictDelay({
    operator: "Daewoo",
    bus_type: "Executive",
    from_city: fromCity,
    to_city: toCity,
    distance_km: distanceKm || 0,
    planned_duration_min: durationMin || 0,
    departure_hour: 18,
    temp_c: w.tempC ?? 0,
    humidity: w.humidity ?? 0,
    wind_ms: w.windMs ?? 0,
    condition: w.condition || "Unknown",
    travel_date: "2026-03-02",
    price: 2000,
  });

  console.log("Maps:", { distanceKm, durationMin });
  console.log("Weather:", w);
  console.log("Prediction:", pred);
})();