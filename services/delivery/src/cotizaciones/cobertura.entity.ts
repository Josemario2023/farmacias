import { Entity, PrimaryGeneratedColumn, Column } from "typeorm";

@Entity({ name: "COBERTURA_SUCURSAL" })
export class CoberturaSucursal {
  @PrimaryGeneratedColumn({ name: "COBERTURA_ID" })
  coberturaId: number;

  @Column({ name: "SUCURSAL_ID", type: "number" })
  sucursalId: number;

  @Column({ name: "RADIO_KM", type: "number" })
  radioKm: number;

  @Column({ name: "TIEMPO_ESTIMADO_MIN", type: "number" })
  tiempoEstimadoMin: number;
}