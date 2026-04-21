const axios = require("axios");

const AI_BASE = (
  process.env.AI_SERVICE_URL ||
  process.env.FASTAPI_URL ||
  process.env.FRAUD_SERVICE_URL ||
  "http://127.0.0.1:8000"
).replace(/\/+$/, "");

async function predictDelay(payload) {
  try {
    const { data } = await axios.post(
      `${AI_BASE}/insights/predict_delay`,
      payload,
      { timeout: 15000 }
    );
    return data;
  } catch (error) {
    throw new Error(
      `predictDelay failed: ${
        error.response?.data
          ? JSON.stringify(error.response.data)
          : error.message
      }`
    );
  }
}

async function runDelayAgent(payload) {
  try {
    const { data } = await axios.post(
      `${AI_BASE}/insights/run_delay_agent`,
      payload,
      { timeout: 20000 }
    );
    return data;
  } catch (error) {
    throw new Error(
      `runDelayAgent failed: ${
        error.response?.data
          ? JSON.stringify(error.response.data)
          : error.message
      }`
    );
  }
}

module.exports = { predictDelay, runDelayAgent };