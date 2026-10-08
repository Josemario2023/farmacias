import { api } from "./client";

export interface Hallazgo {
  hallazgoId: number;
  tipo: string;
  severidad: "ALTA" | "MEDIA" | "BAJA";
  descripcion: string;
  sucursalId: number;
  regionId: number;
  monto: number | null;
  estado: string;
  creadoEn: string;
}

export async function obtenerHallazgos(filtros?: { estado?: string; severidad?: string }) {
  const { data } = await api.get("/hallazgos", { params: filtros });
  return data as Hallazgo[];
}

export async function resumenHallazgos() {
  const { data } = await api.get("/hallazgos/resumen");
  return data as { severidad: string; cantidad: number }[];
}

// Tablero de ventas por región
export async function ventasPorRegion(desde: string, hasta: string) {
  const { data } = await api.get("/tableros/ventas-region", { params: { desde, hasta } });
  return data as {
    regionId: number;
    totalVentas: number;
    cantidadVentas: number;
    sucursales: number;
  }[];
}

// Consolidar las ventas de un día
export async function consolidarVentas(fecha: string) {
  const { data } = await api.post("/consolidados/ventas", null, { params: { fecha } });
  return data;
}

export interface RegistroBitacora {
  bitacoraId: number;
  esquema: string;
  tabla: string;
  operacion: string;
  clavePk: string;
  valoresAnteriores: string | null;
  valoresNuevos: string | null;
  usuarioApp: string | null;
  fechaEvento: string;
}

export async function obtenerBitacora(filtros?: {
  esquema?: string;
  tabla?: string;
  operacion?: string;
  fechaInicio?: string;
  fechaFin?: string;
}): Promise<RegistroBitacora[]> {
  const { data } = await api.get("/bitacora", { params: filtros });
  return data;
}

export async function resumenBitacora() {
  const { data } = await api.get("/bitacora/resumen");
  return data as { esquema: string; tabla: string; operacion: string; cantidad: number }[];
}

export async function cambiarEstadoHallazgo(id: number, estado: string) {
  const { data } = await api.patch("/hallazgos/" + id + "/estado", { estado });
  return data;
}

export async function cajaPorRegion(desde: string, hasta: string) {
  const { data } = await api.get("/tableros/caja-region", { params: { desde, hasta } });
  return data as {
    regionId: number;
    totalIngresos: number;
    diferenciaAcumulada: number;
    sucursales: number;
  }[];
}

export async function sincronizarBitacora() {
  const { data } = await api.post("/sync");
  return data;
}

// Consolida TODOS los días que tengan eventos de venta
export async function consolidarTodo() {
  const { data } = await api.post("/consolidados/todo");
  return data;
}
export async function ventasDetalle(desde: string, hasta: string) {
  const { data } = await api.get("/tableros/ventas-detalle", { params: { desde, hasta } });
  return data as {
    fecha: string;
    regionId: number;
    sucursalId: number;
    totalVentas: number;
    cantidadVentas: number;
  }[];
}

export async function cajaDetalle(desde: string, hasta: string) {
  const { data } = await api.get("/tableros/caja-detalle", { params: { desde, hasta } });
  return data as {
    fecha: string;
    regionId: number;
    sucursalId: number;
    totalIngresos: number;
    totalEgresos: number;
    diferencia: number;
  }[];
}