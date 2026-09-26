import { Injectable, UnauthorizedException } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import * as bcrypt from "bcrypt";
import { Usuario } from "../usuarios/usuario.entity";
import { OtpService } from "./otp.service";
import { MailService } from "./mail.service";

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(Usuario)
    private readonly usuarioRepo: Repository<Usuario>,
    private readonly jwtService: JwtService,
    private readonly otpService: OtpService,
    private readonly mailService: MailService,
  ) {}

  // PASO 1: valida usuario+contrasena, genera y envia el OTP (NO da token aun)
  async login(username: string, password: string): Promise<{ mensaje: string }> {
    // select explicito: necesitamos el passwordHash (oculto por defecto con select:false)
    const usuario = await this.usuarioRepo.findOne({
      where: { username },
      select: {
        usuarioId: true,
        username: true,
        passwordHash: true,
        nombre: true,
        activo: true,
      },
    });
    if (!usuario) {
      throw new UnauthorizedException("Credenciales invalidas");
    }

    const passwordOk = await bcrypt.compare(password, usuario.passwordHash);
    if (!passwordOk) {
      throw new UnauthorizedException("Credenciales invalidas");
    }

    // Generar el OTP y enviarlo por correo
    const codigo = await this.otpService.generar(usuario.usuarioId);

    const correo = username + "@farmacias.local";
    await this.mailService.enviarOtp(correo, codigo);

    return { mensaje: "Codigo de verificacion enviado a tu correo. Revisa Mailhog." };
  }

  // PASO 2: valida el OTP y AHORA si devuelve el token
  async verifyOtp(username: string, codigo: string): Promise<{ access_token: string }> {
    const usuario = await this.usuarioRepo.findOne({
      where: { username },
      select: {
        usuarioId: true,
        username: true,
        passwordHash: true,
        nombre: true,
        activo: true,
      },
    });
    if (!usuario) {
      throw new UnauthorizedException("Usuario no encontrado");
    }

    const valido = await this.otpService.validar(usuario.usuarioId, codigo);
    if (!valido) {
      throw new UnauthorizedException("Codigo invalido o expirado");
    }

    const payload = { sub: usuario.usuarioId, username: usuario.username };
    return {
      access_token: await this.jwtService.signAsync(payload),
    };
  }
}