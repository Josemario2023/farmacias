import { Injectable, NotFoundException, ConflictException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import * as bcrypt from "bcrypt";
import { Usuario } from "./usuario.entity";
import { CreateUsuarioDto } from "./create-usuario.dto";
import { UpdateUsuarioDto } from "./update-usuario.dto";

@Injectable()
export class UsuariosService {
  constructor(
    @InjectRepository(Usuario)
    private readonly usuarioRepo: Repository<Usuario>,
  ) {}

  // LISTAR (sin passwordHash, por el select:false de la entidad)
  findAll(): Promise<Usuario[]> {
    return this.usuarioRepo.find({ order: { username: "ASC" } });
  }

  // VER uno (404 si no existe)
  async findOne(id: number): Promise<Usuario> {
    const usuario = await this.usuarioRepo.findOne({ where: { usuarioId: id } });
    if (!usuario) {
      throw new NotFoundException("Usuario " + id + " no encontrado");
    }
    return usuario;
  }

  // CREAR (hashea la contrasena, valida username unico)
  async create(dto: CreateUsuarioDto): Promise<Usuario> {
    const existe = await this.usuarioRepo.findOne({ where: { username: dto.username } });
    if (existe) {
      throw new ConflictException("Ya existe el usuario " + dto.username);
    }
    const correo = dto.correo.trim().toLowerCase();
    const correoUsado = await this.usuarioRepo.findOne({ where: { correo } });
    if (correoUsado) {
      throw new ConflictException("Ya existe un usuario con el correo " + correo);
    }
    const passwordHash = await bcrypt.hash(dto.password, 10);
    const usuario = this.usuarioRepo.create({
      username: dto.username,
      passwordHash: passwordHash,
      nombre: dto.nombre,
      correo: correo,
      activo: 1,
    });
    const guardado = await this.usuarioRepo.save(usuario);
    // No devolver el hash
    delete (guardado as any).passwordHash;
    return guardado;
  }

  // EDITAR (si viene password, la hashea)
  async update(id: number, dto: UpdateUsuarioDto): Promise<Usuario> {
    const usuario = await this.findOne(id);

    if (dto.nombre !== undefined) usuario.nombre = dto.nombre;
    if (dto.activo !== undefined) usuario.activo = dto.activo;
    if (dto.correo !== undefined) {
      const correo = dto.correo.trim().toLowerCase();
      const otro = await this.usuarioRepo.findOne({ where: { correo } });
      if (otro && otro.usuarioId !== id) {
        throw new ConflictException("Ya existe un usuario con el correo " + correo);
      }
      usuario.correo = correo;
    }
    if (dto.password) {
      usuario.passwordHash = await bcrypt.hash(dto.password, 10);
    }

    const guardado = await this.usuarioRepo.save(usuario);
    delete (guardado as any).passwordHash;
    return guardado;
  }

  // DESACTIVAR (baja logica: el usuario no se borra, se inhabilita)
  async desactivar(id: number): Promise<Usuario> {
    const usuario = await this.findOne(id);
    usuario.activo = 0;
    return this.usuarioRepo.save(usuario);
  }
}