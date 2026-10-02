import { All,Get, Controller, Body, Query, Req, Res } from "@nestjs/common";
import type { Request, Response } from "express";
import { ProxyService } from "./proxy.service";
import { Public } from "../auth/public.decorator";

@Controller()
export class ProxyController {
  constructor(private readonly proxy: ProxyService) {}
   // Perfil: SÍ requiere token (no lleva @Public)

  @Get("auth/perfil")
  perfil(
    @Req() req: Request,
    @Query() query: any,
    @Res({ passthrough: true }) res: Response,
  ) {
    return this.proxy.reenviar("GET", "auth/perfil", undefined, query, res, (req as any).user);
  }

  @Public()
  @All("auth/*path")
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