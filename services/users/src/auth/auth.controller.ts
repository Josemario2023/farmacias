import { Controller, Post, Get, Body, Res, Req, UnauthorizedException } from "@nestjs/common";
import type { Response, Request } from "express";
import { AuthService } from "./auth.service";

@Controller("auth")
export class AuthController {
  constructor(
    private readonly authService: AuthService,    
  ) {}

  @Post("login")
  login(@Body() body: { username: string; password: string }) {
    return this.authService.login(body.username, body.password);
  }

  @Post("verify-otp")
  async verifyOtp(
    @Body() body: { username: string; codigo: string },
    @Res({ passthrough: true }) res: Response,
  ) {
    const r = await this.authService.verifyOtp(body.username, body.codigo);

    res.cookie("token", r.access_token, {
      httpOnly: true,
      sameSite: "lax",
      secure: false,
      maxAge: 10 * 60 * 1000,
    });

    // Devolver el perfil para que el frontend sepa quien entro
    return { mensaje: "Login exitoso", usuario: r.usuario };
  }

  // Quien esta en sesion (el frontend lo llama al cargar)
   // Quien esta en sesion. El gateway ya valido el token y manda la identidad
  // en la cabecera x-usuario-id, asi que aqui solo la leemos.
  @Get("perfil")
  async perfil(@Req() req: Request) {
    const usuarioId = Number(req.headers["x-usuario-id"]);
    if (!usuarioId) throw new UnauthorizedException("No autenticado");
    return this.authService.perfilDesdeToken(usuarioId);
  }

  @Post("logout")
  logout(@Res({ passthrough: true }) res: Response) {
    res.clearCookie("token", { httpOnly: true, sameSite: "lax", secure: false });
    return { mensaje: "Sesion cerrada" };
  }
}