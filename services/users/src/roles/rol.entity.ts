import { Entity, PrimaryGeneratedColumn, Column } from "typeorm";

// Mapea la tabla ROL del esquema FRM_USERS.
@Entity({ name: "ROL" })
export class Rol {
  @PrimaryGeneratedColumn({ name: "ROL_ID" })
  rolId: number;

  @Column({ name: "CODIGO", length: 30 })
  codigo: string;

  @Column({ name: "NOMBRE", length: 80 })
  nombre: string;
}