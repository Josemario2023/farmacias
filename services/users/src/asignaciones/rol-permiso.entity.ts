import { Entity, PrimaryColumn } from "typeorm";

// Tabla puente ROL_PERMISO (PK compuesta: rol + permiso)
@Entity({ name: "ROL_PERMISO" })
export class RolPermiso {
  @PrimaryColumn({ name: "ROL_ID", type: "number" })
  rolId: number;

  @PrimaryColumn({ name: "PERMISO_ID", type: "number" })
  permisoId: number;
}