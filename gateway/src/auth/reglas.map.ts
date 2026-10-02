
export const REGLAS_PERMISOS: Record<string, { ver?: string; gestionar?: string }> = {
  // ---------- Usuarios y organizacion ----------
  usuarios:    { ver: "USUARIOS_GESTIONAR",   gestionar: "USUARIOS_GESTIONAR" },
  roles:       { ver: "USUARIOS_GESTIONAR",   gestionar: "USUARIOS_GESTIONAR" },
  permisos:    { ver: "USUARIOS_GESTIONAR",   gestionar: "USUARIOS_GESTIONAR" },
  regiones:    { ver: "",                      gestionar: "SUCURSALES_GESTIONAR" },
  sucursales:  { ver: "",                      gestionar: "SUCURSALES_GESTIONAR" },

  // ---------- Inventario ----------
  categorias:        { ver: "INVENTARIO_VER", gestionar: "PRODUCTO_EDITAR" },
  productos:         { ver: "INVENTARIO_VER", gestionar: "PRODUCTO_EDITAR" },
  lotes:             { ver: "INVENTARIO_VER", gestionar: "PRODUCTO_EDITAR" },
  existencias:       { ver: "INVENTARIO_VER" },
  kardex:            { ver: "INVENTARIO_VER" },
  movimientos:       { ver: "INVENTARIO_VER", gestionar: "INVENTARIO_MOVER" },
  "toma-fisica":     { gestionar: "INVENTARIO_MOVER" },
  politicas:         { ver: "INVENTARIO_VER", gestionar: "PRODUCTO_EDITAR" },
  alertas:           { ver: "INVENTARIO_VER" },
  proveedores:       { ver: "INVENTARIO_VER", gestionar: "PRODUCTO_EDITAR" },
  "ordenes-compra":  { ver: "INVENTARIO_VER", gestionar: "COMPRA_AUTORIZAR" },
  traslados:         { ver: "TRASLADO_VER",   gestionar: "TRASLADO_AUTORIZAR" },
  "traslados-formales": { ver: "TRASLADO_VER", gestionar: "TRASLADO_AUTORIZAR" },

  // ---------- Ventas y facturacion ----------
  ventas:   { ver: "VENTA_CREAR",  gestionar: "VENTA_CREAR" },
  clientes: { ver: "VENTA_CREAR",  gestionar: "VENTA_CREAR" },
  facturas: { ver: "FACTURA_VER",  gestionar: "FACTURA_ANULAR" },
  series:   { ver: "FACTURA_VER",  gestionar: "FACTURA_ANULAR" },

  // ---------- Caja ----------
  cajas:              { ver: "CAJA_VER",  gestionar: "CAJA_ABRIR" },
  cortes:             { ver: "CAJA_VER",  gestionar: "CAJA_ABRIR" },
  "movimientos-caja": { ver: "CAJA_VER",  gestionar: "CAJA_ABRIR" },

  // ---------- Auditoria ----------
  eventos:      { ver: "AUDITORIA_VER" },
  consolidados: { ver: "AUDITORIA_VER", gestionar: "AUDITORIA_VER" },
  tableros:     { ver: "AUDITORIA_VER" },
  bitacora:     { ver: "AUDITORIA_VER" },
  hallazgos:    { ver: "AUDITORIA_VER", gestionar: "AUDITORIA_RESOLVER" },
  sync:         { gestionar: "AUDITORIA_VER" },

  // ---------- Entregas ----------
  cobertura:      { ver: "ENTREGA_VER", gestionar: "SUCURSALES_GESTIONAR" },
  "formas-pago":  { ver: "ENTREGA_VER", gestionar: "SUCURSALES_GESTIONAR" },
  disponibilidad: { ver: "ENTREGA_VER" },
  cotizaciones:   { ver: "ENTREGA_VER", gestionar: "ENTREGA_VER" },

  // ---------- Planilla y activos ----------
  empleados:        { ver: "PLANILLA_GESTIONAR", gestionar: "PLANILLA_GESTIONAR" },
  planillas:        { ver: "PLANILLA_GESTIONAR", gestionar: "PLANILLA_GESTIONAR" },
  "pagos-planilla": { gestionar: "PLANILLA_GESTIONAR" },
  "gasto-personal": { ver: "PLANILLA_GESTIONAR" },
  "categorias-activo":    { ver: "ACTIVOS_GESTIONAR", gestionar: "ACTIVOS_GESTIONAR" },
  activos:                { ver: "ACTIVOS_GESTIONAR", gestionar: "ACTIVOS_GESTIONAR" },
  depreciacion:           { gestionar: "ACTIVOS_GESTIONAR" },
  "activos-consolidado":  { ver: "ACTIVOS_GESTIONAR" },
};