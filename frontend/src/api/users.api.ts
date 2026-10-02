import { api } from "./client";

// ---------------- TIPOS ----------------
export interface Region {
  regionId: number;
  codigo: string;
  nombre: string;
  activo: number;
}

export interface Sucursal {
  sucursalId: number;
  regionId: number;
  codigo: string;
  nombre: string;
  tipo: string;
  direccion: string | null;
  activo: number;
}

export interface Usuario {
  usuarioId: number;
  username: string;
  nombre: string;
  activo: number;
}

export interface Rol {
  rolId: number;
  codigo: string;
  nombre: string;
}

export interface Permiso {
  permisoId: number;
  codigo: string;
  descripcion: string;
}

// ---------------- REGIONES ----------------
export const obtenerRegiones = async (): Promise<Region[]> =>
  (await api.get("/regiones")).data;

export const crearRegion = async (dto: { codigo: string; nombre: string }) =>
  (await api.post("/regiones", dto)).data;

export const actualizarRegion = async (id: number, dto: any) =>
  (await api.patch("/regiones/" + id, dto)).data;

export const eliminarRegion = async (id: number) =>
  (await api.delete("/regiones/" + id)).data;

// ---------------- SUCURSALES ----------------
export const obtenerSucursales = async (regionId?: number): Promise<Sucursal[]> =>
  (await api.get("/sucursales", { params: { regionId } })).data;

export const crearSucursal = async (dto: {
  regionId: number; codigo: string; nombre: string; tipo: string; direccion?: string;
}) => (await api.post("/sucursales", dto)).data;

export const actualizarSucursal = async (id: number, dto: any) =>
  (await api.patch("/sucursales/" + id, dto)).data;

export const eliminarSucursal = async (id: number) =>
  (await api.delete("/sucursales/" + id)).data;

// ---------------- USUARIOS ----------------
export const obtenerUsuarios = async (): Promise<Usuario[]> =>
  (await api.get("/usuarios")).data;

export const crearUsuario = async (dto: {
  username: string; password: string; nombre: string;
}) => (await api.post("/usuarios", dto)).data;

export const actualizarUsuario = async (id: number, dto: any) =>
  (await api.patch("/usuarios/" + id, dto)).data;

export const eliminarUsuario = async (id: number) =>
  (await api.delete("/usuarios/" + id)).data;

// ---------------- ROLES ----------------
export const obtenerRoles = async (): Promise<Rol[]> =>
  (await api.get("/roles")).data;

export const crearRol = async (dto: { codigo: string; nombre: string }) =>
  (await api.post("/roles", dto)).data;

export const actualizarRol = async (id: number, dto: any) =>
  (await api.patch("/roles/" + id, dto)).data;

export const eliminarRol = async (id: number) =>
  (await api.delete("/roles/" + id)).data;

// ---------------- PERMISOS ----------------
export const obtenerPermisos = async (): Promise<Permiso[]> =>
  (await api.get("/permisos")).data;

export const crearPermiso = async (dto: { codigo: string; descripcion: string }) =>
  (await api.post("/permisos", dto)).data;

export const eliminarPermiso = async (id: number) =>
  (await api.delete("/permisos/" + id)).data;

// ---------------- ASIGNACIONES N:N ----------------
export const rolesDeUsuario = async (usuarioId: number): Promise<Rol[]> =>
  (await api.get("/usuarios/" + usuarioId + "/roles")).data;

export const asignarRol = async (usuarioId: number, rolId: number) =>
  (await api.post("/usuarios/" + usuarioId + "/roles/" + rolId)).data;

export const quitarRol = async (usuarioId: number, rolId: number) =>
  (await api.delete("/usuarios/" + usuarioId + "/roles/" + rolId)).data;

export const sucursalesDeUsuario = async (usuarioId: number): Promise<Sucursal[]> =>
  (await api.get("/usuarios/" + usuarioId + "/sucursales")).data;

export const asignarSucursal = async (usuarioId: number, sucursalId: number) =>
  (await api.post("/usuarios/" + usuarioId + "/sucursales/" + sucursalId)).data;

export const quitarSucursal = async (usuarioId: number, sucursalId: number) =>
  (await api.delete("/usuarios/" + usuarioId + "/sucursales/" + sucursalId)).data;

export const permisosDeRol = async (rolId: number): Promise<Permiso[]> =>
  (await api.get("/roles/" + rolId + "/permisos")).data;

export const asignarPermiso = async (rolId: number, permisoId: number) =>
  (await api.post("/roles/" + rolId + "/permisos/" + permisoId)).data;

export const quitarPermiso = async (rolId: number, permisoId: number) =>
  (await api.delete("/roles/" + rolId + "/permisos/" + permisoId)).data;