import { api } from "./client";

export interface Factura {
  facturaId: number;
  serieId: number;
  numero: number;
  ventaId: number | null;
  subtotal: number;
  impuesto: number;
  total: number;
  estado: string;
}

export async function obtenerFacturas(): Promise<Factura[]> {
  const { data } = await api.get("/facturas");
  return data;
}