import { All,Get,Post, Controller, Body, Query, Req, Res } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import type { Request, Response } from "express";
import { ProxyService } from "./proxy.service";
import { Public } from "../auth/public.decorator";
import { COOKIE_NOMBRE, COOKIE_SESION } from "../auth/cookie.config";


@Controller()
export class ProxyController {
  constructor(private readonly proxy: ProxyService, private readonly jwt: JwtService,) {}
   // Perfil: SÍ requiere token (no lleva @Public)
  @Public()
  @Get("auth/perfil")
  async perfil(
    @Req() req: Request,
    @Query() query: any,
    @Res({ passthrough: true }) res: Response,
  ) {
    const token = (req as any).cookies?.[COOKIE_NOMBRE];
    if (!token) return { autenticado: false };

    let payload: any;
    try {
      payload = await this.jwt.verifyAsync(token);
    } catch {
      return { autenticado: false };   // 
    }
    res.cookie(COOKIE_NOMBRE, token, COOKIE_SESION);
    
      const perfil = await this.proxy.reenviar(
      "GET", "auth/perfil", undefined, query, res, payload,
    );
    return { autenticado: true, ...perfil };
  }

  @Public()
  @Post(["auth/login", "auth/verify-otp", "auth/logout"])
  auth(
    @Req() req: Request,
    @Body() body: any,
    @Query() query: any,
    @Res({ passthrough: true }) res: Response,
  ) {
    const path = req.path.replace(/^\//, "");
    return this.proxy.reenviar(req.method, path, body, query, res, (req as any).user);
  }

  @All("*path")
  todo(
    @Req() req: Request,
    @Body() body: any,
    @Query() query: any,
    @Res({ passthrough: true }) res: Response,
  ) {
    const path = req.path.replace(/^\//, "");
    return this.proxy.reenviar(req.method, path, body, query, res, (req as any).user);
  }
}