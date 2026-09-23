import { Controller, Post, Get, Body, Res } from "@nestjs/common";
import type { Response } from "express";
import { ProxyService } from "./proxy.service";
import { Public } from "../auth/public.decorator";

@Controller()
export class ProxyController {
  constructor(private readonly proxy: ProxyService) {}

  @Public()
  @Post("auth/login")
  login(@Body() body: any) {
    return this.proxy.forwardToUsers("POST", "/auth/login", body);
  }

  @Public()
  @Post("auth/verify-otp")
  async verifyOtp(@Body() body: any, @Res({ passthrough: true }) res: Response) {
    // Pasamos "res" para que el proxy pueda reenviar la cookie
    return this.proxy.forwardToUsers("POST", "/auth/verify-otp", body, res);
  }

  @Get("usuarios")
  listUsuarios() {
    return this.proxy.forwardToUsers("GET", "/usuarios");
  }

  @Post("usuarios")
  createUsuario(@Body() body: any) {
    return this.proxy.forwardToUsers("POST", "/usuarios", body);
  }
}