import { Entity, PrimaryGeneratedColumn, Column } from "typeorm";

// Mapea la tabla PRODUCTO del esquema FRM_INVENTORY
@Entity({ name: "PRODUCTO" })
export class Producto {
  @PrimaryGeneratedColumn({ name: "PRODUCTO_ID" })
  productoId: number;

  @Column({ name: "CODIGO", length: 30 })
  codigo: string;

  @Column({ name: "NOMBRE", length: 150 })
  nombre: string;

  @Column({ name: "CATEGORIA_ID", type: "number" })
  categoriaId: number;

  @Column({ name: "REQUIERE_RECETA", type: "number", default: 0 })
  requiereReceta: number;

  @Column({ name: "PRECIO_BASE", type: "number", default: 0 })
  precioBase: number;

  @Column({ name: "ACTIVO", type: "number", default: 1 })
  activo: number;
}
