import { Entity, PrimaryGeneratedColumn, Column } from "typeorm";

@Entity({ name: "ORDEN_COMPRA" })
export class OrdenCompra {
  @PrimaryGeneratedColumn({ name: "ORDEN_ID" })
  ordenId: number;

  @Column({ name: "NUMERO", length: 30 })
  numero: string;

  @Column({ name: "PROVEEDOR_ID", type: "number" })
  proveedorId: number;

  @Column({ name: "SUCURSAL_ID", type: "number" })
  sucursalId: number;

  // BORRADOR | AUTORIZADA | RECIBIDA | ANULADA
  @Column({ name: "ESTADO", length: 20, default: "BORRADOR" })
  estado: string;

  @Column({ name: "FECHA", type: "timestamp" })
  fecha: Date;

  @Column({ name: "TOTAL", type: "number", default: 0 })
  total: number;
}