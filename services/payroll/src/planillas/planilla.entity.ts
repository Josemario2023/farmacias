import { Entity, PrimaryGeneratedColumn, Column } from "typeorm";

@Entity({ name: "PLANILLA" })
export class Planilla {
  @PrimaryGeneratedColumn({ name: "PLANILLA_ID" })
  planillaId: number;

  // Formato: "2026-09"
  @Column({ name: "PERIODO", length: 20 })
  periodo: string;

  @Column({ name: "SUCURSAL_ID", type: "number" })
  sucursalId: number;

  @Column({ name: "TOTAL_PAGADO", type: "number", default: 0 })
  totalPagado: number;

  // ABIERTA | CERRADA
  @Column({ name: "ESTADO", length: 10, default: "ABIERTA" })
  estado: string;
}