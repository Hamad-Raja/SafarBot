import axios from "axios";

const API = axios.create({
  baseURL: import.meta.env.VITE_API_ORIGIN || "https://safarbot-91nr.onrender.com",
  withCredentials: true,
});

API.interceptors.request.use((config) => {
  const user = JSON.parse(localStorage.getItem("safarbot_user") || "{}");

  if (user?.token) {
    config.headers.Authorization = `Bearer ${user.token}`;
  }

  return config;
});

export default API;