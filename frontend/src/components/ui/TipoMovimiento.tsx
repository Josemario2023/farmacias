
const TIPOS: Record<string, { label: string; clase: string; esEntrada: boolean }> = {
  INVENTARIO_INICIAL:   { label: "Inventario inicial",   clase: "chip-blue",   esEntrada: true },
  COMPRA:               { label: "Compra",               clase: "chip-green",  esEntrada: true },
  DEVOLUCION_CLIENTE:   { label: "Devolución cliente",   clase: "chip-green",  esEntrada: true },
  AJUSTE_POSITIVO:      { label: "Ajuste positivo",      clase: "chip-blue",   esEntrada: true },
  TRASLADO_ENTRADA:     { label: "Traslado entrada",     clase: "chip-violet", esEntrada: true },
  VENTA:                { label: "Venta",                clase: "chip-green",  esEntrada: false },
  DEVOLUCION_PROVEEDOR: { label: "Devolución proveedor", clase: "chip-amber",  esEntrada: false },
  AJUSTE_NEGATIVO:      { label: "Ajuste negativo",      clase: "chip-amber",  esEntrada: false },
  MERMA:                { label: "Merma",                clase: "chip-red",    esEntrada: false },
  PRODUCTO_VENCIDO:     { label: "Producto vencido",     clase: "chip-red",    esEntrada: false },
  TRASLADO_SALIDA:      { label: "Traslado salida",      clase: "chip-violet", esEntrada: false },
};

export const LISTA_TIPOS = Object.keys(TIPOS);
export const etiquetaTipo = (tipo: string) => TIPOS[tipo]?.label ?? tipo;

export function TipoMovimiento({ tipo }: { tipo: string }) {
  const info = TIPOS[tipo];
  if (!info) return <span className="tag">{tipo}</span>;
  return <span className={"tag " + info.clase}>{info.label}</span>;
}