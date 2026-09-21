import { Controller, Post, Get, Body } from "@nestjs/common";
import { ProxyService } from "./proxy.service";
import { Public } from "../auth/public.decorator";

@Controller()
export class ProxyController {
  constructor(private readonly proxy: ProxyService) {}

  @Public()                          // <-- login SIN token
  @Post("auth/login")
  login(@Body() body: any) {
    return this.proxy.forwardToUsers("POST", "/auth/login", body);
  }

  @Get("usuarios")                   // protegido (requiere token)
  listUsuarios() {
    return this.proxy.forwardToUsers("GET", "/usuarios");
  }

  @Post("usuarios")                  // protegido (requiere token)
  createUsuario(@Body() body: any) {
    return this.proxy.forwardToUsers("POST", "/usuarios", body);
  }
}