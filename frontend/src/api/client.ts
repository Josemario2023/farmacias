import axios from "axios";

// Cliente HTTP que apunta al API Gateway.
// TODAS las llamadas al backend pasan por aqui.
export const api = axios.create({
  baseURL: "http://localhost:3000",   // el Gateway
});

// Interceptor: si hay un token guardado, lo agrega automaticamente
// a cada peticion (en la cabecera Authorization).
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});