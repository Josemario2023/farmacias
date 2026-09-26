import { Entity, PrimaryColumn } from "typeorm";

// Tabla puente USUARIO_ROL (PK compuesta: usuario + rol)
@Entity({ name: "USUARIO_ROL" })
export class UsuarioRol {
  @PrimaryColumn({ name: "USUARIO_ID", type: "number" })
  usuarioId: number;

  @PrimaryColumn({ name: "ROL_ID", type: "number" })
  rolId: number;
}