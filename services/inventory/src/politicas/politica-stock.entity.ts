import { Entity, PrimaryGeneratedColumn, Column } from "typeorm";

// Mapea POLITICA_STOCK: el stock minimo por sucursal/producto.
@Entity({ name: "POLITICA_STOCK" })
export class PoliticaStock {
  @PrimaryGeneratedColumn({ name: "POLITICA_ID" })
  politicaId: number;

  @Column({ name: "SUCURSAL_ID", type: "number" })
  sucursalId: number;

  @Column({ name: "PRODUCTO_ID", type: "number" })
  productoId: number;

  @Column({ name: "STOCK_MINIMO", type: "number" })
  stockMinimo: number;
}