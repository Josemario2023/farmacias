import { Controller, Get, Post, Patch, Body, Param, ParseIntPipe } from "@nestjs/common";
import { FacturasService } from "./facturas.service";
import { CreateSerieDto, EmitirFacturaDto } from "./facturas.dto";

@Controller()
export class FacturasController {
  constructor(private readonly facturasService: FacturasService) {}

  // ----- Series -----
  @Get("series")
  listarSeries() { return this.facturasService.listarSeries(); }

  @Post("series")
  crearSerie(@Body() dto: CreateSerieDto) { return this.facturasService.crearSerie(dto); }

  // ----- Facturas -----
  @Get("facturas")
  findAll() { return this.facturasService.findAll(); }

  // Devuelve la factura CON sus lineas
  @Get("facturas/:id")
  findOne(@Param("id", ParseIntPipe) id: number) { return this.facturasService.findOne(id); }

  // POST /facturas -> emite con correlativo bloqueado
  @Post("facturas")
  emitir(@Body() dto: EmitirFacturaDto) { return this.facturasService.emitir(dto); }

  // PATCH /facturas/1/anular -> anula (conserva el numero)
  @Patch("facturas/:id/anular")
  anular(@Param("id", ParseIntPipe) id: number) { return this.facturasService.anular(id); }
}