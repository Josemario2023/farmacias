import { Entity, PrimaryGeneratedColumn, Column } from "typeorm";

@Entity({ name: "PROVEEDOR" })
export class Proveedor {
  @PrimaryGeneratedColumn({ name: "PROVEEDOR_ID" })
  proveedorId: number;

  @Column({ name: "CODIGO", length: 30 })
  codigo: string;

  @Column({ name: "NOMBRE", length: 150 })
  nombre: string;

  @Column({ name: "NIT", type: "varchar2", length: 20, nullable: true })
  nit: string | null;

  @Column({ name: "TELEFONO", type: "varchar2", length: 30, nullable: true })
  telefono: string | null;

  @Column({ name: "ACTIVO", type: "number", default: 1 })
  activo: number;
}