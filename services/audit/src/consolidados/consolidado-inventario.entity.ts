import { Entity, PrimaryGeneratedColumn, Column } from "typeorm";

@Entity({ name: "CONSOLIDADO_INVENTARIO" })
export class ConsolidadoInventario {
  @PrimaryGeneratedColumn({ name: "CONSOLIDADO_ID" })
  consolidadoId: number;

  @Column({ name: "SUCURSAL_ID", type: "number" })
  sucursalId: number;

  @Column({ name: "REGION_ID", type: "number" })
  regionId: number;

  @Column({ name: "FECHA", type: "date" })
  fecha: Date;

  @Column({ name: "VALOR_INVENTARIO", type: "number", default: 0 })
  valorInventario: number;

  @Column({ name: "PRODUCTOS_BAJO_MINIMO", type: "number", default: 0 })
  productosBajoMinimo: number;
}
