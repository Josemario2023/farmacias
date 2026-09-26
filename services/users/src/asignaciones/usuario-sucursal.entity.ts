import { Entity, PrimaryColumn } from "typeorm";

// Tabla puente USUARIO_SUCURSAL (PK compuesta: usuario + sucursal)
@Entity({ name: "USUARIO_SUCURSAL" })
export class UsuarioSucursal {
  @PrimaryColumn({ name: "USUARIO_ID", type: "number" })
  usuarioId: number;

  @PrimaryColumn({ name: "SUCURSAL_ID", type: "number" })
  sucursalId: number;
}