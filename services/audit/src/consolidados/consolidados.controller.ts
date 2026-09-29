import { Controller, Get, Post, Patch, Body, Param, Query, ParseIntPipe } from "@nestjs/common";
import { ConsolidadosService } from "./consolidados.service";

@Controller()
export class ConsolidadosController {
  constructor(private readonly svc: ConsolidadosService) {}

  // ---------- CONSOLIDACIÓN ----------
  // POST /consolidados/ventas?fecha=2026-09-29
  @Post("consolidados/ventas")
  consolidarVentas(@Query("fecha") fecha: string) {
    const dia = fecha ?? new Date().toISOString().slice(0, 10);
    return this.svc.consolidarVentas(dia);
  }

  // ---------- TABLEROS ----------
  // GET /tableros/ventas-region?desde=2026-09-01&hasta=2026-09-30
  @Get("tableros/ventas-region")
  ventasPorRegion(@Query("desde") desde: string, @Query("hasta") hasta: string) {
    return this.svc.ventasPorRegion(desde, hasta);
  }

  // GET /tableros/ventas-sucursal/1?desde=...&hasta=...
  @Get("tableros/ventas-sucursal/:regionId")
  ventasPorSucursal(
    @Param("regionId", ParseIntPipe) regionId: number,
    @Query("desde") desde: string,
    @Query("hasta") hasta: string,
  ) {
    return this.svc.ventasPorSucursal(regionId, desde, hasta);
  }

  // ---------- HALLAZGOS ----------
  // GET /hallazgos?estado=ABIERTO&severidad=ALTA&regionId=1
  @Get("hallazgos")
  listar(@Query() filtros: any) {
    return this.svc.listarHallazgos(filtros);
  }

  @Get("hallazgos/resumen")
  resumen() {
    return this.svc.resumenHallazgos();
  }

  @Post("hallazgos")
  crear(@Body() datos: any) {
    return this.svc.crearHallazgo(datos);
  }

  // PATCH /hallazgos/1/estado  { "estado": "RESUELTO" }
  @Patch("hallazgos/:id/estado")
  cambiarEstado(@Param("id", ParseIntPipe) id: number, @Body() body: { estado: string }) {
    return this.svc.cambiarEstado(id, body.estado);
  }
}