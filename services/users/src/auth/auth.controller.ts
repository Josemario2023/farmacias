import { Controller, Post, Body, Res } from "@nestjs/common";
import type { Response } from "express";
import { AuthService } from "./auth.service";
import { LoginDto } from "./login.dto";

@Controller("auth")
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post("login")
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto.username, dto.password);
  }

  @Post("verify-otp")
  async verifyOtp(
    @Body() body: { username: string; codigo: string },
    @Res({ passthrough: true }) res: Response,
  ) {
    const { access_token } = await this.authService.verifyOtp(body.username, body.codigo);

    res.cookie("token", access_token, {
      httpOnly: true,
      sameSite: "lax",
      secure: false,
      maxAge: 8 * 60 * 60 * 1000,
    });

    return { mensaje: "Login exitoso", usuario: body.username };
  }
}