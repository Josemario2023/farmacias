import { Entity, PrimaryGeneratedColumn, Column } from "typeorm";

@Entity({ name: "DISPONIBILIDAD" })
export class Disponibilidad {
  @PrimaryGeneratedColumn({ name: "DISPONIBILIDAD_ID" })
  disponibilidadId: number;

  @Column({ name: "SUCURSAL_ID", type: "number" })
  sucursalId: number;

  @Column({ name: "PRODUCTO_ID", type: "number" })
  productoId: number;

  @Column({ name: "NOMBRE_PRODUCTO", length: 150 })
  nombreProducto: string;

  @Column({ name: "CANTIDAD_DISPONIBLE", type: "number", default: 0 })
  cantidadDisponible: number;

  @Column({ name: "PRECIO", type: "number", default: 0 })
  precio: number;
}
