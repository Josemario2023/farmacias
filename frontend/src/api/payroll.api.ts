import { api } from "./client";

export interface Empleado {
  empleadoId: number;
  codigo: string;
  nombre: string;
  puesto: string | null;
  sucursalId: number;
  usuarioId: number | null;
  activo: number; // 1 activo, 0 baja
}

export interface Planilla {
  planillaId: number;
  periodo: string; // "2026-09"
  sucursalId: number;
  totalPagado: number;
  estado: string; // ABIERTA | CERRADA
}

export interface PagoPlanilla {
  pagoPlanillaId: number;
  planillaId: number;
  empleadoId: number;
  fechaPago: string;
  tipo: string; // SALARIO | BONO | OTRO
  montoPagado: number;
}

export interface PlanillaDetalle extends Planilla {
  pagos: PagoPlanilla[];
}

export interface GastoSucursal {
  sucursalId: number;
  totalPagado: number;
  planillas: number;
}

export interface GastoTipo {
  tipo: string;
  total: number;
  pagos: number;
}

// ---------- Empleados ----------
export async function obtenerEmpleados(sucursalId?: number): Promise<Empleado[]> {
  const { data } = await api.get("/empleados", { params: { sucursalId } });
  return data;
}

export async function crearEmpleado(dto: {
  codigo: string;
  nombre: string;
  puesto?: string;
  sucursalId: number;
}): Promise<Empleado> {
  const { data } = await api.post("/empleados", dto);
  return data;
}

export async function actualizarEmpleado(
  id: number,
  dto: Partial<Pick<Empleado, "nombre" | "puesto" | "sucursalId">>,
): Promise<Empleado> {
  const { data } = await api.patch(`/empleados/${id}`, dto);
  return data;
}

export async function desactivarEmpleado(id: number): Promise<Empleado> {
  const { data } = await api.delete(`/empleados/${id}`);
  return data;
}

// ---------- Planillas ----------
export async function obtenerPlanillas(sucursalId?: number): Promise<Planilla[]> {
  const { data } = await api.get("/planillas", { params: { sucursalId } });
  return data;
}

export async function obtenerPlanilla(id: number): Promise<PlanillaDetalle> {
  const { data } = await api.get(`/planillas/${id}`);
  return data;
}

export async function crearPlanilla(dto: { periodo: string; sucursalId: number }): Promise<Planilla> {
  const { data } = await api.post("/planillas", dto);
  return data;
}

export async function cerrarPlanilla(id: number): Promise<Planilla> {
  const { data } = await api.patch(`/planillas/${id}/cerrar`);
  return data;
}

// ---------- Pagos ----------
export async function registrarPago(dto: {
  planillaId: number;
  empleadoId: number;
  tipo: string;
  montoPagado: number;
}): Promise<{ pago: PagoPlanilla; totalPlanilla: number }> {
  const { data } = await api.post("/pagos-planilla", dto);
  return data;
}

// ---------- Consolidados ----------
export async function obtenerGastoPorSucursal(periodo: string): Promise<GastoSucursal[]> {
  const { data } = await api.get("/gasto-personal/sucursal", { params: { periodo } });
  return data;
}

export async function obtenerGastoPorTipo(periodo: string): Promise<GastoTipo[]> {
  const { data } = await api.get("/gasto-personal/tipo", { params: { periodo } });
  return data;
}