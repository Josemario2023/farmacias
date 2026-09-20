// Contrato del evento SaleCreated (venta creada).
// Definido UNA sola vez aqui; lo importan pos (publica) y los que reaccionan.

export interface SaleCreatedEvent {
  ventaId: number;        // id de la venta en pos
  numero: string;         // numero de la venta
  sucursalId: number;     // sucursal donde se hizo (soft ref a users)
  regionId: number;       // region estampada (D9/D10) para consolidar por region
  usuarioId: number;      // cajero que la registro
  total: number;          // total de la venta
  fecha: string;          // fecha ISO (ej. "2026-09-20T10:30:00Z")
  items: SaleItem[];      // lineas de la venta
}

// Cada linea de la venta (para que inventory sepa que descontar)
export interface SaleItem {
  productoId: number;
  loteId: number | null;  // puede no tener lote
  cantidad: number;
  precioUnitario: number;
}
