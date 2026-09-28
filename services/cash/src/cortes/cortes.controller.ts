import { Controller, Get, Post, Patch, Body, Param, ParseIntPipe } from "@nestjs/common";
import { CortesService } from "./cortes.service";
import { CreateCajaDto, AbrirCorteDto, CreateMovimientoCajaDto, CerrarCorteDto } from "./cortes.dto";

@Controller()
export class CortesController {
  constructor(private readonly cortesService: CortesService) {}

  // ----- Cajas -----
  @Get("cajas")
  listarCajas() { return this.cortesService.listarCajas(); }

  @Post("cajas")
  crearCaja(@Body() dto: CreateCajaDto) { return this.cortesService.crearCaja(dto); }

  // ----- Cortes -----
  @Get("cortes")
  findAll() { return this.cortesService.findAll(); }

  // Devuelve el corte CON sus movimientos
  @Get("cortes/:id")
  findOne(@Param("id", ParseIntPipe) id: number) { return this.cortesService.findOne(id); }

  // Corte abierto de una caja (util para el POS)
  @Get("cajas/:cajaId/corte-abierto")
  corteAbierto(@Param("cajaId", ParseIntPipe) cajaId: number) {
    return this.cortesService.corteAbierto(cajaId);
  }

  // 1) ABRIR turno
  @Post("cortes")
  abrir(@Body() dto: AbrirCorteDto) { return this.cortesService.abrir(dto); }

  // 2) Registrar ingreso/egreso
  @Post("movimientos-caja")
  registrarMovimiento(@Body() dto: CreateMovimientoCajaDto) {
    return this.cortesService.registrarMovimiento(dto);
  }

  // 3) CERRAR con conciliacion
  @Patch("cortes/:id/cerrar")
  cerrar(@Param("id", ParseIntPipe) id: number, @Body() dto: CerrarCorteDto) {
    return this.cortesService.cerrar(id, dto);
  }
}
