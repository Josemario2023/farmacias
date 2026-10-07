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

export interface Venta {
  ventaId: number;
  numero: string;
  sucursalId: number;
  usuarioId: number;
  clienteId: number | null;
  total: number;
  estado: string;
  fecha: string;
}

export async function crearVenta(venta: NuevaVenta) {
  const { data } = await api.post("/ventas", venta);
  return data;
}

export async function obtenerVentas() {
  const { data } = await api.get("/ventas");
  return data;
}

export interface Cliente {
  clienteId: number;
  nombre: string;
  identificacion: string; // NIT
  direccion: string;
  telefono: string | null;
}

export interface NuevoCliente {
  nombre: string;
  identificacion: string;
  direccion: string;
  telefono?: string;
}

// Busca por NIT exacto. El backend devuelve una lista; si no hay coincidencia, viene vacía.
export async function buscarClientes(nit: string): Promise<Cliente[]> {
  const { data } = await api.get("/clientes", { params: { nit } });
  return data;
}

export async function crearCliente(cliente: NuevoCliente): Promise<Cliente> {
  const { data } = await api.post("/clientes", cliente);
  return data;
}
export async function obtenerClientes(): Promise<Cliente[]> {
  const { data } = await api.get("/clientes");
  return data;
}