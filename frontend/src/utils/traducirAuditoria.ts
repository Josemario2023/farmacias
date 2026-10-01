
// Nombre legible de cada tabla auditada
const TABLAS: Record<string, string> = {
  VENTA: "Venta",
  MOVIMIENTO_INV: "Movimiento de inventario",
  PRODUCTO: "Producto",
  LOTE: "Lote",
  USUARIO: "Usuario",
  ROL: "Rol",
  USUARIO_ROL: "Asignación de rol",
  CORTE_CAJA: "Corte de caja",
  FACTURA: "Factura",
  ACTIVO_FIJO: "Activo fijo",
  ORDEN_COMPRA: "Orden de compra",
  TRASLADO: "Traslado",
};

// El módulo al que pertenece cada esquema
const MODULOS: Record<string, string> = {
  FRM_USERS: "Usuarios",
  FRM_INVENTORY: "Inventario",
  FRM_POS: "Punto de venta",
  FRM_BILLING: "Facturación",
  FRM_CASH: "Caja",
  FRM_ASSETS: "Activos fijos",
  FRM_PAYROLL: "Planilla",
  FRM_DELIVERY: "Entregas",
};

const OPERACIONES: Record<string, { label: string; color: string }> = {
  INSERT: { label: "Creación", color: "green" },
  UPDATE: { label: "Modificación", color: "orange" },
  DELETE: { label: "Eliminación", color: "red" },
};

// Nombres legibles de los campos más comunes
const CAMPOS: Record<string, string> = {
  producto_id: "Producto",
  productoId: "Producto",
  usuario_id: "Usuario",
  usuarioId: "Usuario",
  sucursal_id: "Sucursal",
  sucursalId: "Sucursal",
  lote_id: "Lote",
  numero_lote: "Número de lote",
  numeroLote: "Número de lote",
  tipo_movimiento: "Tipo de movimiento",
  tipoMovimiento: "Tipo de movimiento",
  stock_anterior: "Stock anterior",
  stockAnterior: "Stock anterior",
  stock_nuevo: "Stock nuevo",
  stockNuevo: "Stock nuevo",
  documento_ref: "Documento",
  documentoRef: "Documento",
  precio_base: "Precio",
  precioBase: "Precio",
  monto_apertura: "Fondo de apertura",
  total_contado: "Efectivo contado",
  total_sistema: "Efectivo esperado",
  diferencia: "Diferencia",
  estado: "Estado",
  nombre: "Nombre",
  codigo: "Código",
  activo: "Activo",
  total: "Total",
  entrada: "Entrada",
  salida: "Salida",
};

export const nombreTabla = (t: string) => TABLAS[t] ?? t.replace(/_/g, " ").toLowerCase();
export const nombreModulo = (e: string) => MODULOS[e] ?? e.replace("FRM_", "");
export const infoOperacion = (o: string) =>
  OPERACIONES[o] ?? { label: o, color: "default" };
export const nombreCampo = (c: string) => CAMPOS[c] ?? c.replace(/_/g, " ");

// Convierte el JSON crudo en una lista de "campo: valor" legible
export function descomponerJson(json: string | null): { campo: string; valor: string }[] {
  if (!json) return [];
  try {
    const obj = JSON.parse(json);
    return Object.entries(obj)
      .filter(([, v]) => v !== null && v !== "")
      .map(([k, v]) => ({
        campo: nombreCampo(k),
        valor: formatearValor(k, v),
      }));
  } catch {
    return [];
  }
}

// Da formato al valor según el campo
function formatearValor(campo: string, valor: any): string {
  if (valor === null || valor === undefined) return "—";
  if (campo === "activo") return valor === 1 || valor === "1" ? "Sí" : "No";
  if (/precio|total|monto|diferencia/i.test(campo)) {
    return "Q " + Number(valor).toFixed(2);
  }
  return String(valor);
}

// Arma una frase corta que resume el cambio
export function resumirCambio(r: {
  tabla: string;
  operacion: string;
  clavePk: string;
  valoresNuevos: string | null;
}): string {
  const tabla = nombreTabla(r.tabla);
  const op = infoOperacion(r.operacion).label.toLowerCase();

  // Intentar sacar un identificador legible del JSON
  let detalle = "#" + r.clavePk;
  try {
    const obj = r.valoresNuevos ? JSON.parse(r.valoresNuevos) : {};
    const legible =
      obj.numero ?? obj.codigo ?? obj.nombre ?? obj.numero_lote ?? obj.numeroLote;
    if (legible) detalle = String(legible);
  } catch { /* se queda el id */ }

  return tabla + " " + detalle + " · " + op;
}