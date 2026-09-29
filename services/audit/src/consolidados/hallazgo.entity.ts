import { Entity, PrimaryGeneratedColumn, Column } from "typeorm";

@Entity({ name: "HALLAZGO" })
export class Hallazgo {
  @PrimaryGeneratedColumn({ name: "HALLAZGO_ID" })
  hallazgoId: number;

  // FALTANTE_CAJA | SOBRANTE_CAJA | DIFERENCIA_TRASLADO |
  // VENTA_SIN_FACTURAR | MERMA_EXCESIVA
  @Column({ name: "TIPO", length: 40 })
  tipo: string;

  // ALTA | MEDIA | BAJA
  @Column({ name: "SEVERIDAD", length: 10 })
  severidad: string;

  @Column({ name: "DESCRIPCION", length: 500 })
  descripcion: string;

  @Column({ name: "SUCURSAL_ID", type: "number" })
  sucursalId: number;

  @Column({ name: "REGION_ID", type: "number" })
  regionId: number;

  @Column({ name: "MONTO", type: "number", nullable: true })
  monto: number | null;

  // ABIERTO | EN_REVISION | RESUELTO
  @Column({ name: "ESTADO", length: 15, default: "ABIERTO" })
  estado: string;

  @Column({ name: "CREADO_EN", type: "timestamp" })
  creadoEn: Date;
}