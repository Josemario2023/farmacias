import { api } from "./client";

export type EstadoTraslado = "SOLICITADO" | "AUTORIZADO" | "ENVIADO" | "RECIBIDO" | "ANULADO";

export interface Traslado {
  trasladoId: number;
  numero: string;
  sucursalOrigenId: number;
  sucursalDestinoId: number;
  estado: EstadoTraslado;
  solicitadoPor: number;
  autorizadoPor: number | null;
  recibidoPor: number | null;
  fecha: string;
}

export interface LineaTraslado {
  trasladoDetalleId: number;
  trasladoId: number;
  productoId: number;
  loteId: number;
  cantSolicitada: number;
  cantEnviada: number | null;
  cantRecibida: number | null;
}

export interface TrasladoDetalle extends Traslado {
  lineas: LineaTraslado[];
}

export interface NuevoTraslado {
  numero: string;
  sucursalOrigenId: number;
  sucursalDestinoId: number;
  solicitadoPor: number;
  lineas: { productoId: number; loteId: number; cantSolicitada: number }[];
}

export async function obtenerTraslados(): Promise<Traslado[]> {
  const { data } = await api.get("/traslados-formales");
  return data;
}

export async function obtenerTraslado(id: number): Promise<TrasladoDetalle> {
  const { data } = await api.get(`/traslados-formales/${id}`);
  return data;
}

// 1) Solicitar
export async function solicitarTraslado(dto: NuevoTraslado): Promise<TrasladoDetalle> {
  const { data } = await api.post("/traslados-formales", dto);
  return data;
}

// 2) Autorizar
export async function autorizarTraslado(id: number, usuarioId: number): Promise<Traslado> {
  const { data } = await api.patch(`/traslados-formales/${id}/autorizar`, { usuarioId });
  return data;
}

// 3) Enviar: sale el stock del origen
export async function enviarTraslado(
  id: number,
  dto: { usuarioId: number; lineas: { trasladoDetalleId: number; cantEnviada: number }[] },
) {
  const { data } = await api.post(`/traslados-formales/${id}/enviar`, dto);
  return data;
}

// 4) Recibir: entra el stock al destino. Si hay diferencias, vienen en data.diferencias
export async function recibirTraslado(
  id: number,
  dto: { usuarioId: number; lineas: { trasladoDetalleId: number; cantRecibida: number }[] },
) {
  const { data } = await api.post(`/traslados-formales/${id}/recibir`, dto);
  return data;
}

export async function anularTraslado(id: number): Promise<Traslado> {
  const { data } = await api.patch(`/traslados-formales/${id}/anular`);
  return data;
}