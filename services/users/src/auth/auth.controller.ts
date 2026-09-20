import { Controller, Post, Body } from "@nestjs/common";
import { AuthService } from "./auth.service";
import { LoginDto } from "./login.dto";

@Controller("auth")
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post("login")            // POST /auth/login
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto.username, dto.password);
  }
}
