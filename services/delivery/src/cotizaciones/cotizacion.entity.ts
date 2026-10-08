import { Entity, PrimaryGeneratedColumn, Column } from "typeorm";

@Entity({ name: "COTIZACION" })
export class Cotizacion {
  @PrimaryGeneratedColumn({ name: "COTIZACION_ID" })
  cotizacionId: number;

  // Referencia libre (cotizaciones viejas); las nuevas usan los campos del cliente
  @Column({ name: "CLIENTE_REF", type: "varchar2", length: 100, nullable: true })
  clienteRef: string | null;

  @Column({ name: "CLIENTE_NOMBRE", type: "varchar2", length: 150, nullable: true })
  clienteNombre: string | null;

  @Column({ name: "CLIENTE_DIRECCION", type: "varchar2", length: 250, nullable: true })
  clienteDireccion: string | null;

  @Column({ name: "CLIENTE_TELEFONO", type: "varchar2", length: 30, nullable: true })
  clienteTelefono: string | null;

  // Solo las cotizaciones viejas (un producto) lo traen; las nuevas usan COTIZACION_DETALLE
  @Column({ name: "PRODUCTO_ID", type: "number", nullable: true })
  productoId: number | null;

  @Column({ name: "SUCURSAL_ASIGNADA_ID", type: "number" })
  sucursalAsignadaId: number;

  @Column({ name: "PRECIO", type: "number", nullable: true })
  precio: number | null;

  @Column({ name: "TOTAL", type: "number", nullable: true })
  total: number | null;

  // En las nuevas: la forma de pago elegida (una sola)
  @Column({ name: "FORMA_PAGO", type: "varchar2", length: 20, nullable: true })
  formaPago: string | null;

  @Column({ name: "TIEMPO_ESTIMADO_MIN", type: "number", nullable: true })
  tiempoEstimadoMin: number | null;

  // PENDIENTE | CONFIRMADA | CANCELADA
  @Column({ name: "ESTADO", length: 15, default: "PENDIENTE" })
  estado: string;

  @Column({ name: "CREADO_EN", type: "timestamp" })
  creadoEn: Date;
}