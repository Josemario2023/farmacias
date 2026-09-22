import { Entity, PrimaryGeneratedColumn, Column } from "typeorm";

// Mapea la tabla VENTA del esquema FRM_POS
@Entity({ name: "VENTA" })
export class Venta {
  @PrimaryGeneratedColumn({ name: "VENTA_ID" })
  ventaId: number;

  @Column({ name: "NUMERO", length: 30 })
  numero: string;

  @Column({ name: "SUCURSAL_ID", type: "number" })
  sucursalId: number;

  @Column({ name: "USUARIO_ID", type: "number" })
  usuarioId: number;

  @Column({ name: "CORTE_ID", type: "number", nullable: true })
  corteId: number | null;

  @Column({ name: "CLIENTE_ID", type: "number", nullable: true })
  clienteId: number | null;

  @Column({ name: "TOTAL", type: "number", default: 0 })
  total: number;

  @Column({ name: "ESTADO", length: 20, default: "PAGADA" })
  estado: string;
}
