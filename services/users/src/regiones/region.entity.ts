import { Entity, PrimaryGeneratedColumn, Column } from "typeorm";

// Mapea la tabla REGION del esquema FRM_USERS.
@Entity({ name: "REGION" })
export class Region {
  @PrimaryGeneratedColumn({ name: "REGION_ID" })
  regionId: number;

  @Column({ name: "CODIGO", length: 20 })
  codigo: string;

  @Column({ name: "NOMBRE", length: 100 })
  nombre: string;

  @Column({ name: "ACTIVO", type: "number", default: 1 })
  activo: number;
}