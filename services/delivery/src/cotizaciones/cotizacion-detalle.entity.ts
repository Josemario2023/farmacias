import { Entity, PrimaryGeneratedColumn, Column } from "typeorm";

@Entity({ name: "COTIZACION_DETALLE" })
export class CotizacionDetalle {
  @PrimaryGeneratedColumn({ name: "DETALLE_ID" })
  detalleId: number;

  @Column({ name: "COTIZACION_ID", type: "number" })
  cotizacionId: number;

  @Column({ name: "PRODUCTO_ID", type: "number" })
  productoId: number;

  @Column({ name: "NOMBRE_PRODUCTO", type: "varchar2", length: 200, nullable: true })
  nombreProducto: string | null;

  @Column({ name: "CANTIDAD", type: "number" })
  cantidad: number;

  @Column({ name: "PRECIO_UNITARIO", type: "number" })
  precioUnitario: number;

  @Column({ name: "TOTAL", type: "number" })
  total: number;
}