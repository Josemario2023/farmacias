import { Entity, PrimaryGeneratedColumn, Column } from "typeorm";

// Mapea la tabla CATEGORIA del esquema FRM_INVENTORY.
@Entity({ name: "CATEGORIA" })
export class Categoria {
  @PrimaryGeneratedColumn({ name: "CATEGORIA_ID" })
  categoriaId: number;

  @Column({ name: "NOMBRE", length: 100 })
  nombre: string;
}