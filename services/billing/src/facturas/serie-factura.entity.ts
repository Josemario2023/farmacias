import { Entity, PrimaryGeneratedColumn, Column } from "typeorm";

@Entity({ name: "SERIE_FACTURA" })
export class SerieFactura {
  @PrimaryGeneratedColumn({ name: "SERIE_ID" })
  serieId: number;

  @Column({ name: "SUCURSAL_ID", type: "number" })
  sucursalId: number;

  @Column({ name: "SERIE", length: 20 })
  serie: string;

  @Column({ name: "CORRELATIVO_ACTUAL", type: "number", default: 0 })
  correlativoActual: number;

  @Column({ name: "ACTIVO", type: "number", default: 1 })
  activo: number;
}