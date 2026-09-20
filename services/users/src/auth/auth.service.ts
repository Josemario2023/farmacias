import { Injectable, UnauthorizedException } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import * as bcrypt from "bcrypt";
import { Usuario } from "../usuarios/usuario.entity";

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(Usuario)
    private readonly usuarioRepo: Repository<Usuario>,
    private readonly jwtService: JwtService,
  ) {}

  async login(username: string, password: string): Promise<{ access_token: string }> {
    // 1) Buscar el usuario por username
    const usuario = await this.usuarioRepo.findOne({ where: { username } });
    if (!usuario) {
      throw new UnauthorizedException("Credenciales invalidas");
    }

    // 2) Comparar la password recibida contra el hash guardado
    const passwordOk = await bcrypt.compare(password, usuario.passwordHash);
    if (!passwordOk) {
      throw new UnauthorizedException("Credenciales invalidas");
    }

    // 3) Armar el contenido del token (payload) y firmarlo
    const payload = {
      sub: usuario.usuarioId,   // "sub" = subject: el id del usuario (estandar JWT)
      username: usuario.username,
    };
    return {
      access_token: await this.jwtService.signAsync(payload),
    };
  }
}
