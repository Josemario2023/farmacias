import { api } from "./client";

// Llama al paso 1 del login: envia usuario y contraseña
export async function login(username: string, password: string) {
  const { data } = await api.post("/auth/login", { username, password });
  return data;
}

// Llama al paso 2: verifica el codigo OTP (el navegador recibe la cookie solo)
export async function verifyOtp(username: string, codigo: string) {
  const { data } = await api.post("/auth/verify-otp", { username, codigo });
  return data;
}