import { Entity, PrimaryGeneratedColumn, Column } from "typeorm";

@Entity({ name: "FORMA_PAGO_SUCURSAL" })
export class FormaPagoSucursal {
  @PrimaryGeneratedColumn({ name: "FORMA_PAGO_ID" })
  formaPagoId: number;

  @Column({ name: "SUCURSAL_ID", type: "number" })
  sucursalId: number;

  @Column({ name: "FORMA_PAGO", length: 20 })
  formaPago: string;

  @Column({ name: "ACTIVO", type: "number", default: 1 })
  activo: number;
}