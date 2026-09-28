import { Entity, PrimaryGeneratedColumn, Column } from "typeorm";

@Entity({ name: "MOVIMIENTO_CAJA" })
export class MovimientoCaja {
  @PrimaryGeneratedColumn({ name: "MOVIMIENTO_ID" })
  movimientoId: number;

  @Column({ name: "CORTE_ID", type: "number" })
  corteId: number;

  // INGRESO | EGRESO
  @Column({ name: "TIPO", length: 20 })
  tipo: string;

  @Column({ name: "CONCEPTO", length: 150 })
  concepto: string;

  @Column({ name: "MONTO", type: "number" })
  monto: number;

  @Column({ name: "REF_ID", type: "number", nullable: true })
  refId: number | null;

  @Column({ name: "FECHA", type: "timestamp" })
  fecha: Date;
}