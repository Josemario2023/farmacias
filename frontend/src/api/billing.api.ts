import { api } from "./client";

export interface Factura {
  facturaId: number;
  serieId: number;
  numero: number;
  ventaId: number | null;
  clienteId: number | null;
  sucursalId: number;
  subtotal: number;
  impuesto: number;
  total: number;
  estado: string;
}

export interface LineaFactura {
  detalleId: number;
  facturaId: number;
  productoId: number;
  descripcion: string;
  cantidad: number;
  precioUnitario: number;
  impuesto: number;
  total: number;
}

export interface FacturaDetalle extends Factura {
  lineas: LineaFactura[];
}

export interface Serie {
  serieId: number;
  sucursalId: number;
  serie: string;
  correlativoActual: number;
  activo: number;
}

export async function obtenerFacturas(): Promise<Factura[]> {
  const { data } = await api.get("/facturas");
  return data;
}

export async function obtenerFactura(id: number): Promise<FacturaDetalle> {
  const { data } = await api.get(`/facturas/${id}`);
  return data;
}

export async function anularFactura(id: number): Promise<Factura> {
  const { data } = await api.patch(`/facturas/${id}/anular`);
  return data;
}

export async function obtenerSeries(): Promise<Serie[]> {
  const { data } = await api.get("/series");
  return data;
}