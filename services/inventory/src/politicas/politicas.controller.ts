import { Controller, Get, Post, Delete, Body, Param, Query, ParseIntPipe } from "@nestjs/common";
import { PoliticasService } from "./politicas.service";
import { CreatePoliticaDto } from "./create-politica.dto";

@Controller()
export class PoliticasController {
  constructor(private readonly politicasService: PoliticasService) {}

  @Get("politicas")
  findAll() { return this.politicasService.findAll(); }

  @Post("politicas")
  upsert(@Body() dto: CreatePoliticaDto) { return this.politicasService.upsert(dto); }

  @Delete("politicas/:id")
  remove(@Param("id", ParseIntPipe) id: number) { return this.politicasService.remove(id); }

  // ALERTAS: productos bajo minimo
  // GET /alertas/bajo-minimo?sucursalId=1
  @Get("alertas/bajo-minimo")
  bajoMinimo(@Query("sucursalId") sucursalId?: string) {
    return this.politicasService.alertasBajoMinimo(sucursalId ? Number(sucursalId) : undefined);
  }

  // ALERTAS: lotes por vencer
  // GET /alertas/por-vencer?dias=60&sucursalId=1
  @Get("alertas/por-vencer")
  porVencer(@Query("dias") dias?: string, @Query("sucursalId") sucursalId?: string) {
    return this.politicasService.alertasPorVencer(
      dias ? Number(dias) : 60,
      sucursalId ? Number(sucursalId) : undefined,
    );
  }
}