import { Entity, PrimaryGeneratedColumn, Column } from "typeorm";

// Mapea la tabla USUARIO del esquema FRM_USERS.
// Equivale a una entidad de EF Core con [Table]/[Column].
@Entity({ name: "USUARIO" })
export class Usuario {
  @PrimaryGeneratedColumn({ name: "USUARIO_ID" })
  usuarioId: number;

  @Column({ name: "USERNAME", length: 50 })
  username: string;

  @Column({ name: "PASSWORD_HASH", length: 255 })
  passwordHash: string;

  @Column({ name: "NOMBRE", length: 120 })
  nombre: string;

  @Column({ name: "ACTIVO", type: "number", default: 1 })
  activo: number;
}
