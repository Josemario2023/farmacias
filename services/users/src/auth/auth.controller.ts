import { Controller, Post, Body } from "@nestjs/common";
import { AuthService } from "./auth.service";
import { LoginDto } from "./login.dto";

@Controller("auth")
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  // PASO 1: usuario + contrasena -> envia OTP
  @Post("login")
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto.username, dto.password);
  }

  // PASO 2: usuario + codigo OTP -> devuelve el token
  @Post("verify-otp")
  verifyOtp(@Body() body: { username: string; codigo: string }) {
    return this.authService.verifyOtp(body.username, body.codigo);
  }
}
