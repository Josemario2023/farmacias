import { Entity, PrimaryGeneratedColumn, Column } from "typeorm";

@Entity({ name: "PERMISO" })
export class Permiso {
  @PrimaryGeneratedColumn({ name: "PERMISO_ID" })
  permisoId: number;

  @Column({ name: "CODIGO", length: 50 })
  codigo: string;

  @Column({ name: "DESCRIPCION", type: "varchar2", length: 150, nullable: true })
  descripcion: string | null;
}