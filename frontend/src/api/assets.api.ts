import { api } from "./client";

export interface CategoriaActivo {
  categoriaActivoId: number;
  nombre: string;
  vidaUtilMeses: number;
  metodoDepreciacion: string; // LINEA_RECTA | SALDO_DECRECIENTE
  tasaAnual: number | null;
}

export interface Activo {
  activoId: number;
  codigo: string;
  nombre: string;
  categoriaActivoId: number;
  sucursalId: number;
  valorAdquisicion: number;
  fechaAdquisicion: string;
  estado: string; // ACTIVO | BAJA
}

export interface Depreciacion {
  depreciacionId: number;
  activoId: number;
  periodo: string;
  monto: number;
  depreciacionAcumulada: number;
  valorLibros: number;
}

export interface ActivoDetalle extends Activo {
  valorActual: number;
  depreciaciones: Depreciacion[];
}

export interface ResultadoDepreciacion {
  mensaje: string;
  periodo: string;
  activosProcesados: number;
  totalDepreciado: number;
  detalle: { activo: string; metodo: string; monto: number; acumulada: number; valorLibros: number }[];
}

export interface ValorSucursal {
  sucursalId: number;
  cantidadActivos: number;
  valorAdquisicion: number;
  valorEnLibros: number;
}

export async function obtenerCategoriasActivo(): Promise<CategoriaActivo[]> {
  const { data } = await api.get("/categorias-activo");
  return data;
}

export async function crearCategoriaActivo(dto: {
  nombre: string;
  vidaUtilMeses: number;
  metodoDepreciacion: string;
  tasaAnual?: number;
}): Promise<CategoriaActivo> {
  const { data } = await api.post("/categorias-activo", dto);
  return data;
}

export async function obtenerActivos(sucursalId?: number, estado?: string): Promise<Activo[]> {
  const { data } = await api.get("/activos", { params: { sucursalId, estado } });
  return data;
}

export async function obtenerActivo(id: number): Promise<ActivoDetalle> {
  const { data } = await api.get(`/activos/${id}`);
  return data;
}

export async function crearActivo(dto: {
  codigo: string;
  nombre: string;
  categoriaActivoId: number;
  sucursalId: number;
  valorAdquisicion: number;
  fechaAdquisicion: string; // YYYY-MM-DD
}): Promise<Activo> {
  const { data } = await api.post("/activos", dto);
  return data;
}

export async function darDeBajaActivo(id: number): Promise<Activo> {
  const { data } = await api.patch(`/activos/${id}/baja`);
  return data;
}

export async function calcularDepreciacion(dto: {
  periodo: string;
  sucursalId?: number;
}): Promise<ResultadoDepreciacion> {
  const { data } = await api.post("/depreciacion/calcular", dto);
  return data;
}

export async function obtenerValorPorSucursal(): Promise<ValorSucursal[]> {
  const { data } = await api.get("/activos-consolidado/valor-sucursal");
  return data;
}
