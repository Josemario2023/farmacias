
// siempre que su primer segmento ya este aqui.
export const MAPA_RUTAS: Record<string, string> = {
  // users (3001)
  "auth": "USERS",
  "usuarios": "USERS",
  "regiones": "USERS",
  "sucursales": "USERS",
  "roles": "USERS",
  "permisos": "USERS",

  // inventory (3002)
  "categorias": "INVENTORY",
  "productos": "INVENTORY",
  "lotes": "INVENTORY",
  "existencias": "INVENTORY",
  "kardex": "INVENTORY",
  "movimientos": "INVENTORY",
  "traslados": "INVENTORY",
  "traslados-formales": "INVENTORY",
  "toma-fisica": "INVENTORY",
  "politicas": "INVENTORY",
  "alertas": "INVENTORY",
  "proveedores": "INVENTORY",
  "ordenes-compra": "INVENTORY",

  // pos (3003)
  "ventas": "POS",
  "clientes": "POS",

  // billing (3004)
  "facturas": "BILLING",
  "series": "BILLING",

  // cash (3005)
  "cajas": "CASH",
  "cortes": "CASH",
  "movimientos-caja": "CASH",

  // audit (3006)
  "eventos": "AUDIT",
  "consolidados": "AUDIT",
  "tableros": "AUDIT",
  "hallazgos": "AUDIT",
  "sync": "AUDIT",

  // delivery (3007)
  "cobertura": "DELIVERY",
  "formas-pago": "DELIVERY",
  "disponibilidad": "DELIVERY",
  "cotizaciones": "DELIVERY",

  // payroll (3008)
  "empleados": "PAYROLL",
  "planillas": "PAYROLL",
  "pagos-planilla": "PAYROLL",
  "gasto-personal": "PAYROLL",

  // assets (3009)
  "categorias-activo": "ASSETS",
  "activos": "ASSETS",
  "depreciacion": "ASSETS",
  "activos-consolidado": "ASSETS",
};