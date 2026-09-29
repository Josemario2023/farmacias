import { Controller, Get, Post, Patch, Body, Param, Query, ParseIntPipe } from "@nestjs/common";
import { CotizacionesService } from "./cotizaciones.service";

@Controller()
export class CotizacionesController {
  constructor(private readonly svc: CotizacionesService) {}

  //  COBERTURA 
  @Get("cobertura")
  listarCobertura() { return this.svc.listarCobertura(); }

  @Post("cobertura")
  crearCobertura(@Body() dto: any) { return this.svc.crearCobertura(dto); }

  //  FORMAS DE PAGO 
  @Get("formas-pago")
  listarFormasPago(@Query("sucursalId") sucursalId?: string) {
    return this.svc.listarFormasPago(sucursalId ? Number(sucursalId) : undefined);
  }

  @Post("formas-pago")
  crearFormaPago(@Body() dto: any) { return this.svc.crearFormaPago(dto); }

  //  DISPONIBILIDAD (read model) 
  // GET /disponibilidad?productoId=1&sucursalId=1
  @Get("disponibilidad")
  listarDisponibilidad(
    @Query("productoId") productoId?: string,
    @Query("sucursalId") sucursalId?: string,
  ) {
    return this.svc.listarDisponibilidad(
      productoId ? Number(productoId) : undefined,
      sucursalId ? Number(sucursalId) : undefined,
    );
  }

  // GET /disponibilidad/buscar?texto=acetamin  (lo que usa el operador)
  @Get("disponibilidad/buscar")
  buscar(@Query("texto") texto: string) {
    return this.svc.buscarPorNombre(texto ?? "");
  }

  // Alta/actualizacion manual del read model (util para cargar datos de prueba)
  @Post("disponibilidad")
  actualizarDisponibilidad(@Body() dto: any) {
    return this.svc.actualizarDisponibilidad(dto);
  }

  // COTIZAR 
  @Post("cotizaciones")
  cotizar(@Body() dto: any) { return this.svc.cotizar(dto); }

  @Get("cotizaciones")
  listarCotizaciones(@Query("estado") estado?: string) {
    return this.svc.listarCotizaciones(estado);
  }

  @Patch("cotizaciones/:id/estado")
  cambiarEstado(@Param("id", ParseIntPipe) id: number, @Body() body: { estado: string }) {
    return this.svc.cambiarEstadoCotizacion(id, body.estado);
  }
}