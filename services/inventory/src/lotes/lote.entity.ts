import { Entity, PrimaryGeneratedColumn, Column } from "typeorm";

// Mapea la tabla LOTE del esquema FRM_INVENTORY.
// Un lote pertenece a un producto y tiene su fecha de vencimiento.
@Entity({ name: "LOTE" })
export class Lote {
  @PrimaryGeneratedColumn({ name: "LOTE_ID" })
  loteId: number;

  @Column({ name: "PRODUCTO_ID", type: "number" })
  productoId: number;

  @Column({ name: "NUMERO_LOTE", length: 50 })
  numeroLote: string;

  @Column({ name: "FECHA_VENCIMIENTO", type: "date" })
  fechaVencimiento: Date;
}