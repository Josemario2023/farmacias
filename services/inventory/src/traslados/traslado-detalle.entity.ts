import { Entity, PrimaryGeneratedColumn, Column } from "typeorm";

@Entity({ name: "TRASLADO_DETALLE" })
export class TrasladoDetalle {
  @PrimaryGeneratedColumn({ name: "TRASLADO_DETALLE_ID" })
  trasladoDetalleId: number;

  @Column({ name: "TRASLADO_ID", type: "number" })
  trasladoId: number;

  @Column({ name: "PRODUCTO_ID", type: "number" })
  productoId: number;

  @Column({ name: "LOTE_ID", type: "number" })
  loteId: number;

  @Column({ name: "CANT_SOLICITADA", type: "number" })
  cantSolicitada: number;

  @Column({ name: "CANT_ENVIADA", type: "number", nullable: true })
  cantEnviada: number | null;

  @Column({ name: "CANT_RECIBIDA", type: "number", nullable: true })
  cantRecibida: number | null;
}
