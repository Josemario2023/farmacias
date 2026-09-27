import { Entity, PrimaryGeneratedColumn, Column } from "typeorm";

@Entity({ name: "ORDEN_COMPRA_DETALLE" })
export class OrdenCompraDetalle {
  @PrimaryGeneratedColumn({ name: "ORDEN_DETALLE_ID" })
  ordenDetalleId: number;

  @Column({ name: "ORDEN_ID", type: "number" })
  ordenId: number;

  @Column({ name: "PRODUCTO_ID", type: "number" })
  productoId: number;

  @Column({ name: "CANTIDAD", type: "number" })
  cantidad: number;

  @Column({ name: "COSTO_UNITARIO", type: "number" })
  costoUnitario: number;

  @Column({ name: "TOTAL_LINEA", type: "number" })
  totalLinea: number;
}