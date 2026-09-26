import { Controller, Get, Post, Delete, Param, ParseIntPipe } from "@nestjs/common";
import { AsignacionesService } from "./asignaciones.service";

@Controller()
export class AsignacionesController {
  constructor(private readonly svc: AsignacionesService) {}

  // ----- Roles de un usuario -----
  @Get("usuarios/:usuarioId/roles")
  rolesDeUsuario(@Param("usuarioId", ParseIntPipe) usuarioId: number) {
    return this.svc.rolesDeUsuario(usuarioId);
  }

  @Post("usuarios/:usuarioId/roles/:rolId")
  asignarRol(
    @Param("usuarioId", ParseIntPipe) usuarioId: number,
    @Param("rolId", ParseIntPipe) rolId: number,
  ) {
    return this.svc.asignarRol(usuarioId, rolId);
  }

  @Delete("usuarios/:usuarioId/roles/:rolId")
  quitarRol(
    @Param("usuarioId", ParseIntPipe) usuarioId: number,
    @Param("rolId", ParseIntPipe) rolId: number,
  ) {
    return this.svc.quitarRol(usuarioId, rolId);
  }

  // ----- Permisos de un rol -----
  @Get("roles/:rolId/permisos")
  permisosDeRol(@Param("rolId", ParseIntPipe) rolId: number) {
    return this.svc.permisosDeRol(rolId);
  }

  @Post("roles/:rolId/permisos/:permisoId")
  asignarPermiso(
    @Param("rolId", ParseIntPipe) rolId: number,
    @Param("permisoId", ParseIntPipe) permisoId: number,
  ) {
    return this.svc.asignarPermiso(rolId, permisoId);
  }

  @Delete("roles/:rolId/permisos/:permisoId")
  quitarPermiso(
    @Param("rolId", ParseIntPipe) rolId: number,
    @Param("permisoId", ParseIntPipe) permisoId: number,
  ) {
    return this.svc.quitarPermiso(rolId, permisoId);
  }

  // ----- Sucursales de un usuario -----
  @Get("usuarios/:usuarioId/sucursales")
  sucursalesDeUsuario(@Param("usuarioId", ParseIntPipe) usuarioId: number) {
    return this.svc.sucursalesDeUsuario(usuarioId);
  }

  @Post("usuarios/:usuarioId/sucursales/:sucursalId")
  asignarSucursal(
    @Param("usuarioId", ParseIntPipe) usuarioId: number,
    @Param("sucursalId", ParseIntPipe) sucursalId: number,
  ) {
    return this.svc.asignarSucursal(usuarioId, sucursalId);
  }

  @Delete("usuarios/:usuarioId/sucursales/:sucursalId")
  quitarSucursal(
    @Param("usuarioId", ParseIntPipe) usuarioId: number,
    @Param("sucursalId", ParseIntPipe) sucursalId: number,
  ) {
    return this.svc.quitarSucursal(usuarioId, sucursalId);
  }
}