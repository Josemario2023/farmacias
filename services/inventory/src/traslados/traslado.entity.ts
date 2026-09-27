import { Entity, PrimaryGeneratedColumn, Column } from "typeorm";

@Entity({ name: "TRASLADO" })
export class Traslado {
  @PrimaryGeneratedColumn({ name: "TRASLADO_ID" })
  trasladoId: number;

  @Column({ name: "NUMERO", length: 30 })
  numero: string;

  @Column({ name: "SUCURSAL_ORIGEN_ID", type: "number" })
  sucursalOrigenId: number;

  @Column({ name: "SUCURSAL_DESTINO_ID", type: "number" })
  sucursalDestinoId: number;

  // SOLICITADO | AUTORIZADO | ENVIADO | RECIBIDO | ANULADO
  @Column({ name: "ESTADO", length: 20, default: "SOLICITADO" })
  estado: string;

  @Column({ name: "SOLICITADO_POR", type: "number" })
  solicitadoPor: number;

  @Column({ name: "AUTORIZADO_POR", type: "number", nullable: true })
  autorizadoPor: number | null;

  @Column({ name: "RECIBIDO_POR", type: "number", nullable: true })
  recibidoPor: number | null;

  @Column({ name: "FECHA", type: "timestamp" })
  fecha: Date;
}