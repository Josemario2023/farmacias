import { Entity, PrimaryGeneratedColumn, Column } from "typeorm";

@Entity({ name: "EMPLEADO" })
export class Empleado {
  @PrimaryGeneratedColumn({ name: "EMPLEADO_ID" })
  empleadoId: number;

  @Column({ name: "CODIGO", length: 30 })
  codigo: string;

  @Column({ name: "NOMBRE", length: 150 })
  nombre: string;

  // type explicito porque es nullable (string | null)
  @Column({ name: "PUESTO", type: "varchar2", length: 80, nullable: true })
  puesto: string | null;

  @Column({ name: "SUCURSAL_ID", type: "number" })
  sucursalId: number;

  @Column({ name: "USUARIO_ID", type: "number", nullable: true })
  usuarioId: number | null;

  @Column({ name: "ACTIVO", type: "number", default: 1 })
  activo: number;
}
