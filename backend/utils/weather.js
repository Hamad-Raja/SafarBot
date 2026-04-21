const axios = require("axios");

async function getWeatherByCity(city) {
  const key = process.env.OPENWEATHER_API_KEY;

  if (!key || key === "YOUR_KEY") {
    throw new Error("Missing/invalid OPENWEATHER_API_KEY in .env");
  }

  const { data } = await axios.get(
    "https://api.openweathermap.org/data/2.5/weather",
    {
      params: {
        q: city,
        appid: key,
        units: "metric",
      },
      timeout: 15000,
    }
  );

  return {
    tempC: data?.main?.temp ?? null,
    humidity: data?.main?.humidity ?? null,
    windMs: data?.wind?.speed ?? null,
    condition: data?.weather?.[0]?.main ?? "Unknown",
  };
}

async function getWeather({ city }) {
  return getWeatherByCity(city);
}

module.exports = { getWeatherByCity, getWeather };
