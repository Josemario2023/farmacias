import { Injectable, UnauthorizedException } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { InjectRepository, InjectDataSource } from "@nestjs/typeorm";
import { Repository, DataSource } from "typeorm";
import * as bcrypt from "bcrypt";
import { Usuario } from "../usuarios/usuario.entity";
import { OtpService } from "./otp.service";
import { MailService } from "./mail.service";

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(Usuario)
    private readonly usuarioRepo: Repository<Usuario>,
    @InjectDataSource()
    private readonly dataSource: DataSource,
    private readonly jwtService: JwtService,
    private readonly otpService: OtpService,
    private readonly mailService: MailService,
  ) {}

  // PASO 1: valida usuario+contrasena, genera y envia el OTP (NO da token aun)
  async login(username: string, password: string): Promise<{ mensaje: string }> {
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

    // Un usuario desactivado no puede entrar, aunque la contrasena sea correcta
    if (usuario.activo !== 1) {
      throw new UnauthorizedException("El usuario esta desactivado");
    }

    const passwordOk = await bcrypt.compare(password, usuario.passwordHash);
    if (!passwordOk) {
      throw new UnauthorizedException("Credenciales invalidas");
    }

    const codigo = await this.otpService.generar(usuario.usuarioId);
    const correo = username + "@farmacias.local";
    await this.mailService.enviarOtp(correo, codigo);

    return { mensaje: "Codigo de verificacion enviado a tu correo. Revisa Mailhog." };
  }

  // PASO 2: valida el OTP y devuelve el token CON la identidad completa
  async verifyOtp(username: string, codigo: string): Promise<any> {
    const usuario = await this.usuarioRepo.findOne({
      where: { username },
      select: {
        usuarioId: true,
        username: true,
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

    // Construir el PERFIL 
    const perfil = await this.obtenerPerfil(usuario.usuarioId);

    const payload = {
      sub: usuario.usuarioId,
      username: usuario.username,
      nombre: usuario.nombre,
      sucursalId: perfil.sucursalId,
      regionId: perfil.regionId,
      roles: perfil.roles,
      permisos: perfil.permisos,
    };

    return {
      access_token: await this.jwtService.signAsync(payload),
      usuario: payload,   // el frontend lo usa para pintar la interfaz
    };
  }

  
  // Arma el perfil del usuario: sucursal, region, roles y permisos
 
  async obtenerPerfil(usuarioId: number): Promise<any> {
    // 1) Roles del usuario
    const roles = await this.dataSource.query(
      `SELECT r.codigo AS "codigo", r.nombre AS "nombre"
         FROM USUARIO_ROL ur
         JOIN ROL r ON r.rol_id = ur.rol_id
        WHERE ur.usuario_id = :1`,
      [usuarioId],
    );

    // 2) Permisos (la union de todos sus roles, sin repetir)
    const permisos = await this.dataSource.query(
      `SELECT DISTINCT p.codigo AS "codigo"
         FROM USUARIO_ROL ur
         JOIN ROL_PERMISO rp ON rp.rol_id = ur.rol_id
         JOIN PERMISO p ON p.permiso_id = rp.permiso_id
        WHERE ur.usuario_id = :1`,
      [usuarioId],
    );

    // 3) Sucursal asignada (la primera, si tiene varias) y su region
    const sucursales = await this.dataSource.query(
      `SELECT s.sucursal_id AS "sucursalId",
              s.nombre      AS "sucursalNombre",
              s.region_id   AS "regionId"
         FROM USUARIO_SUCURSAL us
         JOIN SUCURSAL s ON s.sucursal_id = us.sucursal_id
        WHERE us.usuario_id = :1
          AND s.activo = 1
        ORDER BY s.sucursal_id`,
      [usuarioId],
    );

    const principal = sucursales[0] ?? null;

    return {
      usuarioId,
      sucursalId: principal ? Number(principal.sucursalId) : null,
      sucursalNombre: principal ? principal.sucursalNombre : null,
      regionId: principal ? Number(principal.regionId) : null,
      sucursales: sucursales.map((s: any) => ({
        sucursalId: Number(s.sucursalId),
        nombre: s.sucursalNombre,
        regionId: Number(s.regionId),
      })),
      roles: roles.map((r: any) => r.codigo),
      permisos: permisos.map((p: any) => p.codigo),
    };
  }

  // Endpoint para que el frontend sepa quien esta en sesion
  async perfilDesdeToken(usuarioId: number): Promise<any> {
    const usuario = await this.usuarioRepo.findOne({
      where: { usuarioId },
      select: { usuarioId: true, username: true, nombre: true, activo: true },
    });
    if (!usuario) throw new UnauthorizedException("Usuario no encontrado");

    const perfil = await this.obtenerPerfil(usuarioId);
    return { ...perfil, username: usuario.username, nombre: usuario.nombre };
  }
}