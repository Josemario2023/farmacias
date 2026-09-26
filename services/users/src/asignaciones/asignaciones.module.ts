import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { UsuarioRol } from "./usuario-rol.entity";
import { RolPermiso } from "./rol-permiso.entity";
import { UsuarioSucursal } from "./usuario-sucursal.entity";
import { Usuario } from "../usuarios/usuario.entity";
import { Rol } from "../roles/rol.entity";
import { Permiso } from "../permisos/permiso.entity";
import { Sucursal } from "../sucursales/sucursal.entity";
import { AsignacionesService } from "./asignaciones.service";
import { AsignacionesController } from "./asignaciones.controller";

@Module({
  imports: [
    TypeOrmModule.forFeature([
      UsuarioRol, RolPermiso, UsuarioSucursal,
      Usuario, Rol, Permiso, Sucursal,
    ]),
  ],
  controllers: [AsignacionesController],
  providers: [AsignacionesService],
})
export class AsignacionesModule {}