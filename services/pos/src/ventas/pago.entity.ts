import { Entity, PrimaryGeneratedColumn, Column } from "typeorm";

@Entity({ name: "PAGO" })
export class Pago {
  @PrimaryGeneratedColumn({ name: "PAGO_ID" })
  pagoId: number;

  @Column({ name: "VENTA_ID", type: "number" })
  ventaId: number;

  // EFECTIVO | TARJETA | TRANSFERENCIA
  @Column({ name: "FORMA_PAGO", length: 20 })
  formaPago: string;

  @Column({ name: "MONTO", type: "number" })
  monto: number;

  @Column({ name: "REFERENCIA", type: "varchar2", length: 50, nullable: true })
  referencia: string | null;
}