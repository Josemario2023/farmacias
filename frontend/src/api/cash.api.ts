import { api } from "./client";

export interface Caja {
  cajaId: number;
  sucursalId: number;
  nombre: string;
  activo: number;
}

export interface MovimientoCaja {
  movimientoId: number;
  corteId: number;
  tipo: "INGRESO" | "EGRESO";
  concepto: string;
  monto: number;
  refId: number | null;
  fecha: string;
}

export interface Corte {
  corteId: number;
  cajaId: number;
  sucursalId: number;
  usuarioId: number;
  turno: string;
  montoApertura: number;
  totalSistema: number;
  totalContado: number | null;
  diferencia: number | null;
  estado: "ABIERTO" | "CERRADO";
  movimientos?: MovimientoCaja[];
}

export async function obtenerCajas(sucursalId?: number): Promise<Caja[]> {
  const { data } = await api.get("/cajas", { params: { sucursalId } });
  return data;
}

export async function crearCaja(dto: { sucursalId: number; nombre: string }) {
  const { data } = await api.post("/cajas", dto);
  return data;
}

export async function obtenerCortes(sucursalId?: number): Promise<Corte[]> {
  const { data } = await api.get("/cortes", { params: { sucursalId } });
  return data;
}

// Trae el corte CON sus movimientos
export async function verCorte(corteId: number): Promise<Corte> {
  const { data } = await api.get("/cortes/" + corteId);
  return data;
}

// El corte ABIERTO de una caja (null si no hay)
export async function corteAbierto(cajaId: number): Promise<Corte | null> {
  const { data } = await api.get("/cajas/" + cajaId + "/corte-abierto");
  return data;
}

export async function abrirCorte(dto: {
  cajaId: number;
  sucursalId: number;
  usuarioId: number;
  turno: string;
  montoApertura: number;
}) {
  const { data } = await api.post("/cortes", dto);
  return data;
}

export async function registrarMovimientoCaja(dto: {
  corteId: number;
  tipo: "INGRESO" | "EGRESO";
  concepto: string;
  monto: number;
}) {
  const { data } = await api.post("/movimientos-caja", dto);
  return data;
}

export async function cerrarCorte(corteId: number, dto: {
  totalContado: number;
  usuarioId: number;
}) {
  const { data } = await api.patch("/cortes/" + corteId + "/cerrar", dto);
  return data;
}