import { Entity, PrimaryGeneratedColumn, Column } from "typeorm";

@Entity({ name: "VENTA_DETALLE" })
export class VentaDetalle {
  @PrimaryGeneratedColumn({ name: "VENTA_DETALLE_ID" })
  ventaDetalleId: number;

  @Column({ name: "VENTA_ID", type: "number" })
  ventaId: number;

  @Column({ name: "PRODUCTO_ID", type: "number" })
  productoId: number;

  @Column({ name: "LOTE_ID", type: "number", nullable: true })
  loteId: number | null;

  @Column({ name: "DESCRIPCION", length: 200 })
  descripcion: string;

  @Column({ name: "CANTIDAD", type: "number" })
  cantidad: number;

  @Column({ name: "PRECIO_UNITARIO", type: "number" })
  precioUnitario: number;

  @Column({ name: "TOTAL", type: "number" })
  total: number;
}