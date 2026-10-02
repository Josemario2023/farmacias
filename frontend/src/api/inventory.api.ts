import { api } from "./client";

// Los filtros que acepta el kardex (los 8 del requisito)
export interface FiltrosKardex {
  productoId?: number;
  loteId?: number;
  numeroLote?: string;
  tipoMovimiento?: string;
  sucursalId?: number;
  usuarioId?: number;
  fechaInicio?: string;
  fechaFin?: string;
}

// Un movimiento tal como lo devuelve el backend
export interface Movimiento {
  movimientoId: number;
  sucursalId: number;
  productoId: number;
  loteId: number;
  numeroLote: string;
  fechaVencimiento: string;
  tipoMovimiento: string;
  stockAnterior: number;
  entrada: number;
  salida: number;
  stockNuevo: number;
  usuarioId: number;
  documentoRef: string | null;
  observaciones: string | null;
  fechaHora: string;
}

export interface Producto {
  productoId: number;
  codigo: string;
  nombre: string;
  categoriaId: number;
  requiereReceta: number;
  precioBase: number;
  activo: number;
}

// Consultar el kardex con filtros
export async function obtenerKardex(filtros: FiltrosKardex): Promise<Movimiento[]> {
  const { data } = await api.get("/kardex", { params: filtros });
  return data;
}

// Historial completo de un producto (orden cronológico)
export async function obtenerKardexProducto(productoId: number): Promise<Movimiento[]> {
  const { data } = await api.get("/kardex/producto/" + productoId);
  return data;
}

// Catálogo de productos (para el selector de filtro)
export async function obtenerProductos(): Promise<Producto[]> {
  const { data } = await api.get("/productos");
  return data;
}

// Existencias actuales
export async function obtenerExistencias(sucursalId?: number, productoId?: number) {
  const { data } = await api.get("/existencias", { params: { sucursalId, productoId } });
  return data;
}


// ---------- CATEGORIAS ----------
export interface Categoria {
  categoriaId: number;
  nombre: string;
}

export async function obtenerCategorias(): Promise<Categoria[]> {
  const { data } = await api.get("/categorias");
  return data;
}

export async function crearCategoria(nombre: string): Promise<Categoria> {
  const { data } = await api.post("/categorias", { nombre });
  return data;
}

export const actualizarCategoria = async (id: number, nombre: string) =>
  (await api.patch("/categorias/" + id, { nombre })).data;

export const eliminarCategoria = async (id: number) =>
  (await api.delete("/categorias/" + id)).data;

// ---------- PRODUCTOS ----------
export async function crearProducto(dto: {
  codigo: string;
  nombre: string;
  categoriaId: number;
  precioBase: number;
  requiereReceta?: number;
}): Promise<Producto> {
  const { data } = await api.post("/productos", dto);
  return data;
}

export const actualizarProducto = async (id: number, dto: any) =>
  (await api.patch("/productos/" + id, dto)).data;

export const eliminarProducto = async (id: number) =>
  (await api.delete("/productos/" + id)).data;

// ---------- LOTES ----------
export interface Lote {
  loteId: number;
  productoId: number;
  numeroLote: string;
  fechaVencimiento: string;
}

export async function obtenerLotes(productoId?: number): Promise<Lote[]> {
  const { data } = await api.get("/lotes", { params: { productoId } });
  return data;
}

export async function crearLote(dto: {
  productoId: number;
  numeroLote: string;
  fechaVencimiento: string;
}): Promise<Lote> {
  const { data } = await api.post("/lotes", dto);
  return data;
}

export const actualizarLote = async (id: number, dto: any) =>
  (await api.patch("/lotes/" + id, dto)).data;

export const eliminarLote = async (id: number) =>
  (await api.delete("/lotes/" + id)).data;


// ---------- MOVIMIENTOS (dar entrada / salida de stock) ----------
export async function registrarMovimiento(dto: {
  sucursalId: number;
  productoId: number;
  loteId: number;
  tipoMovimiento: string;
  cantidad: number;
  usuarioId: number;
  documentoRef?: string;
  observaciones?: string;
}) {
  const { data } = await api.post("/movimientos", dto);
  return data;
}

// ---------- ALERTAS ----------
export async function alertasBajoMinimo(sucursalId?: number) {
  const { data } = await api.get("/alertas/bajo-minimo", { params: { sucursalId } });
  return data;
}

export async function alertasPorVencer(dias = 60, sucursalId?: number) {
  const { data } = await api.get("/alertas/por-vencer", { params: { dias, sucursalId } });
  return data;
}