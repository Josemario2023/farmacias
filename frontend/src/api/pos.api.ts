import { api } from "./client";

export interface LineaVenta {
  productoId: number;
  loteId: number;
  descripcion: string;
  cantidad: number;
  precioUnitario: number;
}

export interface PagoVenta {
  formaPago: "EFECTIVO" | "TARJETA" | "TRANSFERENCIA";
  monto: number;
  referencia?: string;
}

export interface NuevaVenta {
  numero: string;
  sucursalId: number;
  usuarioId: number;
  regionId?: number;
  clienteId?: number;
  lineas: LineaVenta[];
  pagos: PagoVenta[];
}

export async function crearVenta(venta: NuevaVenta) {
  const { data } = await api.post("/ventas", venta);
  return data;
}

export async function obtenerVentas() {
  const { data } = await api.get("/ventas");
  return data;
}