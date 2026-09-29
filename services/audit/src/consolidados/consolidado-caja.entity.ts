import { Entity, PrimaryGeneratedColumn, Column } from "typeorm";

@Entity({ name: "CONSOLIDADO_CAJA" })
export class ConsolidadoCaja {
  @PrimaryGeneratedColumn({ name: "CONSOLIDADO_ID" })
  consolidadoId: number;

  @Column({ name: "SUCURSAL_ID", type: "number" })
  sucursalId: number;

  @Column({ name: "REGION_ID", type: "number" })
  regionId: number;

  @Column({ name: "FECHA", type: "date" })
  fecha: Date;

  @Column({ name: "TOTAL_INGRESOS", type: "number", default: 0 })
  totalIngresos: number;

  @Column({ name: "TOTAL_EGRESOS", type: "number", default: 0 })
  totalEgresos: number;

  @Column({ name: "DIFERENCIA", type: "number", default: 0 })
  diferencia: number;
}
