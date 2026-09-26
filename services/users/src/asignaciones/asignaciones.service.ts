import { Injectable, NotFoundException, ConflictException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository, In } from "typeorm";
import { UsuarioRol } from "./usuario-rol.entity";
import { RolPermiso } from "./rol-permiso.entity";
import { UsuarioSucursal } from "./usuario-sucursal.entity";
import { Usuario } from "../usuarios/usuario.entity";
import { Rol } from "../roles/rol.entity";
import { Permiso } from "../permisos/permiso.entity";
import { Sucursal } from "../sucursales/sucursal.entity";

@Injectable()
export class AsignacionesService {
  constructor(
    @InjectRepository(UsuarioRol) private readonly usuarioRolRepo: Repository<UsuarioRol>,
    @InjectRepository(RolPermiso) private readonly rolPermisoRepo: Repository<RolPermiso>,
    @InjectRepository(UsuarioSucursal) private readonly usuarioSucRepo: Repository<UsuarioSucursal>,
    @InjectRepository(Usuario) private readonly usuarioRepo: Repository<Usuario>,
    @InjectRepository(Rol) private readonly rolRepo: Repository<Rol>,
    @InjectRepository(Permiso) private readonly permisoRepo: Repository<Permiso>,
    @InjectRepository(Sucursal) private readonly sucursalRepo: Repository<Sucursal>,
  ) {}

  // ---------- USUARIO <-> ROL ----------

  async asignarRol(usuarioId: number, rolId: number) {
    // Validar que ambos existan
    const usuario = await this.usuarioRepo.findOne({ where: { usuarioId } });
    if (!usuario) throw new NotFoundException("Usuario " + usuarioId + " no existe");
    const rol = await this.rolRepo.findOne({ where: { rolId } });
    if (!rol) throw new NotFoundException("Rol " + rolId + " no existe");

    // Validar que no este ya asignado
    const ya = await this.usuarioRolRepo.findOne({ where: { usuarioId, rolId } });
    if (ya) throw new ConflictException("El usuario ya tiene ese rol");

    const asignacion = this.usuarioRolRepo.create({ usuarioId, rolId });
    await this.usuarioRolRepo.save(asignacion);
    return { mensaje: "Rol " + rol.codigo + " asignado a " + usuario.username };
  }

  async quitarRol(usuarioId: number, rolId: number) {
    const asignacion = await this.usuarioRolRepo.findOne({ where: { usuarioId, rolId } });
    if (!asignacion) throw new NotFoundException("El usuario no tiene ese rol");
    await this.usuarioRolRepo.remove(asignacion);
    return { mensaje: "Rol quitado" };
  }

  // Lista los roles de un usuario (con sus datos, no solo los ids)
  async rolesDeUsuario(usuarioId: number): Promise<Rol[]> {
    const asignaciones = await this.usuarioRolRepo.find({ where: { usuarioId } });
    const ids = asignaciones.map((a) => a.rolId);
    if (ids.length === 0) return [];
    return this.rolRepo.findBy({rolId:In(ids)});
  }

  // ---------- ROL <-> PERMISO ----------

  async asignarPermiso(rolId: number, permisoId: number) {
    const rol = await this.rolRepo.findOne({ where: { rolId } });
    if (!rol) throw new NotFoundException("Rol " + rolId + " no existe");
    const permiso = await this.permisoRepo.findOne({ where: { permisoId } });
    if (!permiso) throw new NotFoundException("Permiso " + permisoId + " no existe");

    const ya = await this.rolPermisoRepo.findOne({ where: { rolId, permisoId } });
    if (ya) throw new ConflictException("El rol ya tiene ese permiso");

    await this.rolPermisoRepo.save(this.rolPermisoRepo.create({ rolId, permisoId }));
    return { mensaje: "Permiso " + permiso.codigo + " asignado al rol " + rol.codigo };
  }

  async quitarPermiso(rolId: number, permisoId: number) {
    const asignacion = await this.rolPermisoRepo.findOne({ where: { rolId, permisoId } });
    if (!asignacion) throw new NotFoundException("El rol no tiene ese permiso");
    await this.rolPermisoRepo.remove(asignacion);
    return { mensaje: "Permiso quitado" };
  }

  async permisosDeRol(rolId: number): Promise<Permiso[]> {
    const asignaciones = await this.rolPermisoRepo.find({ where: { rolId } });
    const ids = asignaciones.map((a) => a.permisoId);
    if (ids.length === 0) return [];
    return this.permisoRepo.findBy({permisoId: In(ids)});;
  }

  // ---------- USUARIO <-> SUCURSAL ----------

  async asignarSucursal(usuarioId: number, sucursalId: number) {
    const usuario = await this.usuarioRepo.findOne({ where: { usuarioId } });
    if (!usuario) throw new NotFoundException("Usuario " + usuarioId + " no existe");
    const sucursal = await this.sucursalRepo.findOne({ where: { sucursalId } });
    if (!sucursal) throw new NotFoundException("Sucursal " + sucursalId + " no existe");

    const ya = await this.usuarioSucRepo.findOne({ where: { usuarioId, sucursalId } });
    if (ya) throw new ConflictException("El usuario ya esta asignado a esa sucursal");

    await this.usuarioSucRepo.save(this.usuarioSucRepo.create({ usuarioId, sucursalId }));
    return { mensaje: "Usuario " + usuario.username + " asignado a " + sucursal.nombre };
  }

  async quitarSucursal(usuarioId: number, sucursalId: number) {
    const asignacion = await this.usuarioSucRepo.findOne({ where: { usuarioId, sucursalId } });
    if (!asignacion) throw new NotFoundException("El usuario no esta en esa sucursal");
    await this.usuarioSucRepo.remove(asignacion);
    return { mensaje: "Asignacion quitada" };
  }

  async sucursalesDeUsuario(usuarioId: number): Promise<Sucursal[]> {
    const asignaciones = await this.usuarioSucRepo.find({ where: { usuarioId } });
    const ids = asignaciones.map((a) => a.sucursalId);
    if (ids.length === 0) return [];
    return this.sucursalRepo.findBy({sucursalId: In(ids)});
  }
}