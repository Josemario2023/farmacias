import { Entity, PrimaryGeneratedColumn, Column } from "typeorm";

// @Entity le dice a TypeORM: "esta clase representa la tabla CORTE_CAJA"
@Entity({ name: "CORTE_CAJA" })
export class CorteCaja {
  // @PrimaryGeneratedColumn: esta columna es la clave primaria y la genera la BD (IDENTITY)
  @PrimaryGeneratedColumn({ name: "CORTE_ID" })
  corteId: number;

  // @Column: una columna normal. "name" es el nombre EXACTO en Oracle (mayusculas).
  @Column({ name: "CAJA_ID", type: "number" })
  cajaId: number;

  @Column({ name: "SUCURSAL_ID", type: "number" })
  sucursalId: number;

  @Column({ name: "USUARIO_ID", type: "number" })
  usuarioId: number;

  @Column({ name: "TURNO", length: 20 })
  turno: string;

  @Column({ name: "MONTO_APERTURA", type: "number", default: 0 })
  montoApertura: number;

  @Column({ name: "TOTAL_SISTEMA", type: "number", default: 0 })
  totalSistema: number;

  // nullable: true -> esta columna puede estar vacia (NULL) en la BD.
  // Aqui tiene sentido: el conteo solo existe cuando se CIERRA el corte.
  @Column({ name: "TOTAL_CONTADO", type: "number", nullable: true })
  totalContado: number | null;

  @Column({ name: "DIFERENCIA", type: "number", nullable: true })
  diferencia: number | null;

  @Column({ name: "ESTADO", length: 20, default: "ABIERTO" })
  estado: string;
}
