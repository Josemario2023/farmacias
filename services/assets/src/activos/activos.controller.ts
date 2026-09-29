import { Controller, Get, Post, Patch, Body, Param, Query, ParseIntPipe } from "@nestjs/common";
import { ActivosService } from "./activos.service";
import { CreateCategoriaActivoDto, CreateActivoDto, CalcularDepreciacionDto } from "./activos.dto";

@Controller()
export class ActivosController {
  constructor(private readonly svc: ActivosService) {}

  // CATEGORIAS 
  @Get("categorias-activo")
  listarCategorias() { return this.svc.listarCategorias(); }

  @Post("categorias-activo")
  crearCategoria(@Body() dto: CreateCategoriaActivoDto) { return this.svc.crearCategoria(dto); }

  //  ACTIVOS 
  @Get("activos")
  listarActivos(
    @Query("sucursalId") sucursalId?: string,
    @Query("estado") estado?: string,
  ) {
    return this.svc.listarActivos(sucursalId ? Number(sucursalId) : undefined, estado);
  }

  // Devuelve el activo CON su historial y valor actual
  @Get("activos/:id")
  verActivo(@Param("id", ParseIntPipe) id: number) { return this.svc.verActivo(id); }

  @Post("activos")
  crearActivo(@Body() dto: CreateActivoDto) { return this.svc.crearActivo(dto); }

  @Patch("activos/:id/baja")
  darDeBaja(@Param("id", ParseIntPipe) id: number) { return this.svc.darDeBaja(id); }

  //  DEPRECIACION 
  // POST /depreciacion/calcular  { "periodo": "2026-09" }
  @Post("depreciacion/calcular")
  calcular(@Body() dto: CalcularDepreciacionDto) { return this.svc.calcularDepreciacion(dto); }

  //  CONSOLIDADOS 
  @Get("activos-consolidado/valor-sucursal")
  valorPorSucursal() { return this.svc.valorPorSucursal(); }

  // GET /activos-consolidado/gasto?periodo=2026-09
  @Get("activos-consolidado/gasto")
  gastoDepreciacion(@Query("periodo") periodo: string) {
    return this.svc.gastoDepreciacion(periodo);
  }
}