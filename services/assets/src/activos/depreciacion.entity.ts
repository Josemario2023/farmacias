import { Entity, PrimaryGeneratedColumn, Column } from "typeorm";

@Entity({ name: "DEPRECIACION" })
export class Depreciacion {
  @PrimaryGeneratedColumn({ name: "DEPRECIACION_ID" })
  depreciacionId: number;

  @Column({ name: "ACTIVO_ID", type: "number" })
  activoId: number;

  // Formato: "2026-09"
  @Column({ name: "PERIODO", length: 20 })
  periodo: string;

  @Column({ name: "MONTO", type: "number" })
  monto: number;

  @Column({ name: "DEPRECIACION_ACUMULADA", type: "number" })
  depreciacionAcumulada: number;

  @Column({ name: "VALOR_LIBROS", type: "number" })
  valorLibros: number;
}