// frontend/src/http.js
import axios from "axios";
import API_BASE_URL from "./api";

// Cliente con baseURL y header Authorization automático
const http = axios.create({
  baseURL: API_BASE_URL,
});

http.interceptors.request.use((config) => {
  const token = localStorage.getItem("token"); // tu login ya guarda 'token'
  if (token) {
    config.headers = config.headers || {};
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default http;
