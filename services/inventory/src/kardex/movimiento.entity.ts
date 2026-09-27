import { Entity, PrimaryGeneratedColumn, Column } from "typeorm";

// Mapea MOVIMIENTO_INV: el KARDEX. Tabla de SOLO LECTURA desde la app
// (los movimientos se crean SOLO por los procedimientos PL/SQL).
@Entity({ name: "MOVIMIENTO_INV" })
export class MovimientoInv {
  @PrimaryGeneratedColumn({ name: "MOVIMIENTO_ID" })
  movimientoId: number;

  @Column({ name: "SUCURSAL_ID", type: "number" })
  sucursalId: number;

  @Column({ name: "PRODUCTO_ID", type: "number" })
  productoId: number;

  @Column({ name: "LOTE_ID", type: "number" })
  loteId: number;

  @Column({ name: "NUMERO_LOTE", length: 50 })
  numeroLote: string;

  @Column({ name: "FECHA_VENCIMIENTO", type: "date" })
  fechaVencimiento: Date;

  @Column({ name: "TIPO_MOVIMIENTO", length: 25 })
  tipoMovimiento: string;

  @Column({ name: "STOCK_ANTERIOR", type: "number" })
  stockAnterior: number;

  @Column({ name: "ENTRADA", type: "number" })
  entrada: number;

  @Column({ name: "SALIDA", type: "number" })
  salida: number;

  @Column({ name: "STOCK_NUEVO", type: "number" })
  stockNuevo: number;

  @Column({ name: "USUARIO_ID", type: "number" })
  usuarioId: number;

  @Column({ name: "DOCUMENTO_REF", type: "varchar2", length: 50, nullable: true })
  documentoRef: string | null;

  @Column({ name: "OBSERVACIONES", type: "varchar2", length: 300, nullable: true })
  observaciones: string | null;

  @Column({ name: "FECHA_HORA", type: "timestamp" })
  fechaHora: Date;
}