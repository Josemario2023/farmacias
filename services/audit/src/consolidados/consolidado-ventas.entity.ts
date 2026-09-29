import { Entity, PrimaryGeneratedColumn, Column } from "typeorm";

@Entity({ name: "CONSOLIDADO_VENTAS" })
export class ConsolidadoVentas {
  @PrimaryGeneratedColumn({ name: "CONSOLIDADO_ID" })
  consolidadoId: number;

  @Column({ name: "FECHA", type: "date" })
  fecha: Date;

  @Column({ name: "REGION_ID", type: "number" })
  regionId: number;

  @Column({ name: "SUCURSAL_ID", type: "number" })
  sucursalId: number;

  @Column({ name: "TOTAL_VENTAS", type: "number", default: 0 })
  totalVentas: number;

  @Column({ name: "NUM_VENTAS", type: "number", default: 0 })
  cantidadVentas: number;
}