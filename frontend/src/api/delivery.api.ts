import { api } from "./client";

export interface Disponible {
  productoId: number;
  nombreProducto: string;
  sucursalId: number;
  cantidad: number;
  precio: number;
}

export interface LineaCotizacion {
  detalleId: number;
  cotizacionId: number;
  productoId: number;
  nombreProducto: string | null;
  cantidad: number;
  precioUnitario: number;
  total: number;
}

export interface Cotizacion {
  cotizacionId: number;
  clienteRef: string | null;
  clienteNombre: string | null;
  clienteDireccion: string | null;
  clienteTelefono: string | null;
  productoId: number | null;      // solo las cotizaciones viejas (un producto)
  sucursalAsignadaId: number;
  precio: number | null;
  total: number | null;
  formaPago: string | null;
  tiempoEstimadoMin: number | null;
  estado: string;                 // PENDIENTE | CONFIRMADA | CANCELADA
  creadoEn: string;
}

export interface CotizacionDetalle extends Cotizacion {
  lineas: LineaCotizacion[];
}

export interface RespuestaCotizar {
  cotizacionId: number;
  sucursalSugerida: number;
  total: number;
  tiempoEstimadoMin: number | null;
  formasPago: string[];
}

export interface FormaPago {
  formaPagoId: number;
  sucursalId: number;
  formaPago: string;
}

export async function buscarDisponibilidad(texto: string): Promise<Disponible[]> {
  const { data } = await api.get("/disponibilidad/buscar", { params: { texto } });
  return data;
}

export async function cotizar(dto: {
  items: { productoId: number; cantidad: number }[];
  clienteNombre: string;
  clienteDireccion?: string;
  clienteTelefono?: string;
}): Promise<RespuestaCotizar> {
  const { data } = await api.post("/cotizaciones", dto);
  return data;
}

export async function obtenerCotizaciones(estado?: string): Promise<Cotizacion[]> {
  const { data } = await api.get("/cotizaciones", { params: { estado } });
  return data;
}

export async function verCotizacion(id: number): Promise<CotizacionDetalle> {
  const { data } = await api.get(`/cotizaciones/${id}`);
  return data;
}

export async function cambiarEstadoCotizacion(
  id: number,
  estado: "CONFIRMADA" | "CANCELADA",
  formaPago?: string,
): Promise<Cotizacion> {
  const { data } = await api.patch(`/cotizaciones/${id}/estado`, { estado, formaPago });
  return data;
}

export async function obtenerFormasPago(sucursalId: number): Promise<FormaPago[]> {
  const { data } = await api.get("/formas-pago", { params: { sucursalId } });
  return data;
}