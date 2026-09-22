import { Entity, PrimaryGeneratedColumn, Column } from "typeorm";

// Mapea la tabla FACTURA del esquema FRM_BILLING
@Entity({ name: "FACTURA" })
export class Factura {
  @PrimaryGeneratedColumn({ name: "FACTURA_ID" })
  facturaId: number;

  @Column({ name: "SERIE_ID", type: "number" })
  serieId: number;

  @Column({ name: "NUMERO", type: "number" })
  numero: number;

  @Column({ name: "VENTA_ID", type: "number", nullable: true })
  ventaId: number | null;

  @Column({ name: "CLIENTE_ID", type: "number", nullable: true })
  clienteId: number | null;

  @Column({ name: "SUCURSAL_ID", type: "number" })
  sucursalId: number;

  @Column({ name: "SUBTOTAL", type: "number", default: 0 })
  subtotal: number;

  @Column({ name: "IMPUESTO", type: "number", default: 0 })
  impuesto: number;

  @Column({ name: "TOTAL", type: "number", default: 0 })
  total: number;

  @Column({ name: "ESTADO", length: 20, default: "EMITIDA" })
  estado: string;
}
