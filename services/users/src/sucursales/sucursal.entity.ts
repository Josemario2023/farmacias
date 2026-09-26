import { Entity, PrimaryGeneratedColumn, Column } from "typeorm";

// Mapea la tabla SUCURSAL del esquema FRM_USERS.
@Entity({ name: "SUCURSAL" })
export class Sucursal {
  @PrimaryGeneratedColumn({ name: "SUCURSAL_ID" })
  sucursalId: number;

  @Column({ name: "REGION_ID", type: "number" })
  regionId: number;

  @Column({ name: "CODIGO", length: 20 })
  codigo: string;

  @Column({ name: "NOMBRE", length: 120 })
  nombre: string;

  // SUCURSAL = local en centro comercial | STAND = stand en gasolinera
  @Column({ name: "TIPO", length: 20, default: "SUCURSAL" })
  tipo: string;

  @Column({ name: "DIRECCION", type: "varchar2", length: 200, nullable: true })
  direccion: string | null;

  @Column({ name: "ACTIVO", type: "number", default: 1 })
  activo: number;
}