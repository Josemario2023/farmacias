import { Entity, PrimaryGeneratedColumn, Column } from "typeorm";

@Entity({ name: "CAJA" })
export class Caja {
  @PrimaryGeneratedColumn({ name: "CAJA_ID" })
  cajaId: number;

  @Column({ name: "SUCURSAL_ID", type: "number" })
  sucursalId: number;

  @Column({ name: "NOMBRE", length: 80 })
  nombre: string;

  @Column({ name: "ACTIVO", type: "number", default: 1 })
  activo: number;
}