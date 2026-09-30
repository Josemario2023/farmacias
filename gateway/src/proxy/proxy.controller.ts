import { All, Controller, Body, Query, Req, Res, Param } from "@nestjs/common";
import type { Request, Response } from "express";
import { ProxyService } from "./proxy.service";
import { Public } from "../auth/public.decorator";

@Controller()
export class ProxyController {
  constructor(private readonly proxy: ProxyService) {}

  // Rutas PUBLICAS de autenticacion (sin token: el usuario aun no lo tiene)
  @Public()
  @All("auth/*path")
  auth(
    @Req() req: Request,
    @Body() body: any,
    @Query() query: any,
    @Res({ passthrough: true }) res: Response,
  ) {
    const path = req.path.replace(/^\//, "");
    return this.proxy.reenviar(req.method, path, body, query, res);
  }

  // TODO LO DEMAS: protegido por el JwtAuthGuard global
  @All("*path")
  todo(
    @Req() req: Request,
    @Body() body: any,
    @Query() query: any,
    @Res({ passthrough: true }) res: Response,
  ) {
    const path = req.path.replace(/^\//, "");
    return this.proxy.reenviar(req.method, path, body, query, res);
  }
}