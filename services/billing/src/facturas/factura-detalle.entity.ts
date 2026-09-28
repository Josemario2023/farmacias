import { Entity, PrimaryGeneratedColumn, Column } from "typeorm";

@Entity({ name: "FACTURA_DETALLE" })
export class FacturaDetalle {
  @PrimaryGeneratedColumn({ name: "DETALLE_ID" })
  detalleId: number;

  @Column({ name: "FACTURA_ID", type: "number" })
  facturaId: number;

  @Column({ name: "PRODUCTO_ID", type: "number" })
  productoId: number;

  @Column({ name: "DESCRIPCION", length: 200 })
  descripcion: string;

  @Column({ name: "CANTIDAD", type: "number" })
  cantidad: number;

  @Column({ name: "PRECIO_UNITARIO", type: "number" })
  precioUnitario: number;

  @Column({ name: "IMPUESTO", type: "number", default: 0 })
  impuesto: number;

  @Column({ name: "TOTAL", type: "number" })
  total: number;
}