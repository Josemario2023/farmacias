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

// Cierra la sesion: borra la cookie httpOnly en el servidor
export async function logout() {
  const { data } = await api.post("/auth/logout");
  return data;
}

export interface PerfilUsuario {
  usuarioId: number;
  username: string;
  nombre: string;
  sucursalId: number | null;
  sucursalNombre: string | null;
  regionId: number | null;
  sucursales: { sucursalId: number; nombre: string; regionId: number }[];
  roles: string[];
  permisos: string[];
}

export async function obtenerPerfil(): Promise<PerfilUsuario> {
  const { data } = await api.get("/auth/perfil");
  return data;
}