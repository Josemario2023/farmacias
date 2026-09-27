import { Entity, PrimaryGeneratedColumn, Column } from "typeorm";

@Entity({ name: "EXISTENCIA" })
export class Existencia {
  @PrimaryGeneratedColumn({ name: "EXISTENCIA_ID" })
  existenciaId: number;

  @Column({ name: "SUCURSAL_ID", type: "number" })
  sucursalId: number;

  @Column({ name: "PRODUCTO_ID", type: "number" })
  productoId: number;

  @Column({ name: "LOTE_ID", type: "number" })
  loteId: number;

  @Column({ name: "CANTIDAD", type: "number" })
  cantidad: number;
}