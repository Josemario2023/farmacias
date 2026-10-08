import { Controller, Get, Post, Patch, Body, Param, Query, ParseIntPipe } from "@nestjs/common";
import { ConsolidadosService } from "./consolidados.service";

@Controller()
export class ConsolidadosController {
  constructor(private readonly svc: ConsolidadosService) {}

  //  CONSOLIDACIÓN 
  // POST /consolidados/ventas?fecha=2026-09-29
  @Post("consolidados/ventas")
  consolidarVentas(@Query("fecha") fecha: string) {
    const dia = fecha ?? new Date().toISOString().slice(0, 10);
    return this.svc.consolidarVentas(dia);
  }

  //  TABLEROS 
  // GET /tableros/ventas-region?desde=2026-09-01&hasta=2026-09-30
  @Get("tableros/ventas-region")
  ventasPorRegion(@Query("desde") desde: string, @Query("hasta") hasta: string) {
    return this.svc.ventasPorRegion(desde, hasta);
  }
   // GET /tableros/ventas-detalle?desde=2026-09-01&hasta=2026-10-31
  @Get("tableros/ventas-detalle")
  ventasDetalle(@Query("desde") desde: string, @Query("hasta") hasta: string) {
    return this.svc.ventasDetalle(desde, hasta);
  }

  // GET /tableros/caja-detalle?desde=...&hasta=...
  @Get("tableros/caja-detalle")
  cajaDetalle(@Query("desde") desde: string, @Query("hasta") hasta: string) {
    return this.svc.cajaDetalle(desde, hasta);
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
  //CONSOLIDAR CAJA
  @Post("consolidados/caja")
  consolidarCaja(@Query("fecha") fecha: string) {
    const dia = fecha ?? new Date().toISOString().slice(0, 10);
    return this.svc.consolidarCaja(dia);
  }
  //CONSOLIDAR INVENTARIO
  @Post("consolidados/inventario")
  consolidarInventario(@Query("fecha") fecha: string, @Body() datos: any) {
    const dia = fecha ?? new Date().toISOString().slice(0, 10);
    return this.svc.consolidarInventario(dia, datos);
  } 

  //TABLEROS
  @Get("tableros/caja-region")
  cajaPorRegion(@Query("desde") desde: string, @Query("hasta") hasta: string) {
    return this.svc.cajaPorRegion(desde, hasta);
  }

  @Get("tableros/inventario-region")
  inventarioPorRegion(@Query("fecha") fecha: string) {
    return this.svc.inventarioPorRegion(fecha);
  }

    // GET /bitacora?esquema=FRM_USERS&tabla=USUARIO&operacion=UPDATE
  @Get("bitacora")
  bitacora(@Query() filtros: any) {
    return this.svc.consultarBitacora(filtros);
  }

  @Get("bitacora/resumen")
  resumenBitacora() {
    return this.svc.resumenBitacora();
  }

  @Post("consolidados/todo")
  consolidarTodo() {
    return this.svc.consolidarTodo();
  }

  //  HALLAZGOS 
 
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