import { Controller, Get, Post, Body, Param, Query, ParseIntPipe } from "@nestjs/common";
import { KardexService } from "./kardex.service";
import { CreateMovimientoDto } from "./create-movimiento.dto";
import { CreateTrasladoDto } from "./create-traslado.dto";
import { CreateTomaFisicaDto } from "./create-toma-fisica.dto";

@Controller()
export class KardexController {
  constructor(private readonly kardexService: KardexService) {}

  // ---------- REGISTRAR UN MOVIMIENTO (cualquiera de los 11 tipos) ----------
  // POST /movimientos
  @Post("movimientos")
  registrarMovimiento(@Body() dto: CreateMovimientoDto) {
    return this.kardexService.registrarMovimiento(dto);
  }

  // ---------- TRASLADO ENTRE SUCURSALES ----------
  // POST /traslados
  @Post("traslados")
  trasladar(@Body() dto: CreateTrasladoDto) {
    return this.kardexService.trasladar(dto);
  }

  // ---------- TOMA FISICA ----------
  // POST /toma-fisica
  @Post("toma-fisica")
  tomaFisica(@Body() dto: CreateTomaFisicaDto) {
    return this.kardexService.tomaFisica(dto);
  }

  // ---------- CONSULTAR EL KARDEX (con los 8 filtros) ----------
  // GET /kardex?productoId=1&tipoMovimiento=VENTA&fechaInicio=2026-09-01&...
  @Get("kardex")
  consultarKardex(@Query() filtros: any) {
    return this.kardexService.consultarKardex(filtros);
  }

  // ---------- HISTORIAL COMPLETO DE UN PRODUCTO ----------
  // GET /kardex/producto/1
  @Get("kardex/producto/:productoId")
  kardexProducto(@Param("productoId", ParseIntPipe) productoId: number) {
    return this.kardexService.kardexProducto(productoId);
  }

  // ---------- EXISTENCIAS (stock actual) ----------
  // GET /existencias?sucursalId=1&productoId=1
  @Get("existencias")
  existencias(
    @Query("sucursalId") sucursalId?: string,
    @Query("productoId") productoId?: string,
  ) {
    return this.kardexService.existencias(
      sucursalId ? Number(sucursalId) : undefined,
      productoId ? Number(productoId) : undefined,
    );
  }
}