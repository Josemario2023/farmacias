import { Entity, PrimaryGeneratedColumn, Column } from "typeorm";

@Entity({ name: "COTIZACION" })
export class Cotizacion {
  @PrimaryGeneratedColumn({ name: "COTIZACION_ID" })
  cotizacionId: number;

  // Referencia del cliente que llamo (telefono o nombre)
  @Column({ name: "CLIENTE_REF", type: "varchar2", length: 100, nullable: true })
  clienteRef: string | null;

  @Column({ name: "PRODUCTO_ID", type: "number" })
  productoId: number;

  @Column({ name: "SUCURSAL_ASIGNADA_ID", type: "number" })
  sucursalAsignadaId: number;

  @Column({ name: "PRECIO", type: "number" })
  precio: number;

  @Column({ name: "FORMA_PAGO", type: "varchar2", length: 100, nullable: true })
  formaPago: string | null;

  @Column({ name: "TIEMPO_ESTIMADO_MIN", type: "number", nullable: true })
  tiempoEstimadoMin: number | null;

   // PENDIENTE | CONFIRMADA | CANCELADA
  @Column({ name: "ESTADO", length: 15, default: "PENDIENTE" })
  estado: string;

  @Column({ name: "CREADO_EN", type: "timestamp" })
  creadoEn: Date;
}