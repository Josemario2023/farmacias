import { Entity, PrimaryGeneratedColumn, Column } from "typeorm";

@Entity({ name: "ACTIVO_FIJO" })
export class ActivoFijo {
  @PrimaryGeneratedColumn({ name: "ACTIVO_ID" })
  activoId: number;

  @Column({ name: "CODIGO", length: 30 })
  codigo: string;

  @Column({ name: "NOMBRE", length: 150 })
  nombre: string;

  @Column({ name: "CATEGORIA_ACTIVO_ID", type: "number" })
  categoriaActivoId: number;

  @Column({ name: "SUCURSAL_ID", type: "number" })
  sucursalId: number;

  @Column({ name: "VALOR_ADQUISICION", type: "number" })
  valorAdquisicion: number;

  @Column({ name: "FECHA_ADQUISICION", type: "date" })
  fechaAdquisicion: Date;

  // ACTIVO | BAJA
  @Column({ name: "ESTADO", length: 10, default: "ACTIVO" })
  estado: string;
}
