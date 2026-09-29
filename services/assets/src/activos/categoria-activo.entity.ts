import { Entity, PrimaryGeneratedColumn, Column } from "typeorm";

@Entity({ name: "CATEGORIA_ACTIVO" })
export class CategoriaActivo {
  @PrimaryGeneratedColumn({ name: "CATEGORIA_ACTIVO_ID" })
  categoriaActivoId: number;

  @Column({ name: "NOMBRE", length: 100 })
  nombre: string;

  @Column({ name: "VIDA_UTIL_MESES", type: "number" })
  vidaUtilMeses: number;

  // LINEA_RECTA | SALDO_DECRECIENTE
  @Column({ name: "METODO_DEPRECIACION", length: 20 })
  metodoDepreciacion: string;

  @Column({ name: "TASA_ANUAL", type: "number", nullable: true })
  tasaAnual: number | null;
}