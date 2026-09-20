import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import * as bcrypt from "bcrypt";
import { Usuario } from "./usuario.entity";
import { CreateUsuarioDto } from "./create-usuario.dto";

@Injectable()
export class UsuariosService {
  constructor(
    @InjectRepository(Usuario)
    private readonly usuarioRepo: Repository<Usuario>,
  ) {}

  findAll(): Promise<Usuario[]> {
    return this.usuarioRepo.find();
  }

  // Crea un usuario, guardando el HASH de la contrasena (nunca el texto plano)
  async create(dto: CreateUsuarioDto): Promise<Usuario> {
    const passwordHash = await bcrypt.hash(dto.password, 10); // 10 = costo del hash

    const usuario = this.usuarioRepo.create({
      username: dto.username,
      passwordHash: passwordHash,
      nombre: dto.nombre,
      activo: 1,
    });

    return this.usuarioRepo.save(usuario);
  }
}
