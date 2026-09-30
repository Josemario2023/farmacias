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