import { Controller, Get, Post, Patch, Delete, Body, Param, Query, ParseIntPipe } from "@nestjs/common";
import { PlanillasService } from "./planillas.service";
import { CreateEmpleadoDto, CreatePlanillaDto, CreatePagoDto } from "./planillas.dto";

@Controller()
export class PlanillasController {
  constructor(private readonly svc: PlanillasService) {}

  //  EMPLEADOS 
  @Get("empleados")
  listarEmpleados(@Query("sucursalId") sucursalId?: string) {
    return this.svc.listarEmpleados(sucursalId ? Number(sucursalId) : undefined);
  }

  @Get("empleados/:id")
  verEmpleado(@Param("id", ParseIntPipe) id: number) { return this.svc.verEmpleado(id); }

  @Post("empleados")
  crearEmpleado(@Body() dto: CreateEmpleadoDto) { return this.svc.crearEmpleado(dto); }

  @Patch("empleados/:id")
  actualizarEmpleado(@Param("id", ParseIntPipe) id: number, @Body() dto: any) {
    return this.svc.actualizarEmpleado(id, dto);
  }

  @Delete("empleados/:id")
  desactivarEmpleado(@Param("id", ParseIntPipe) id: number) {
    return this.svc.desactivarEmpleado(id);
  }

  // PLANILLAS 
  @Get("planillas")
  listarPlanillas(@Query("sucursalId") sucursalId?: string) {
    return this.svc.listarPlanillas(sucursalId ? Number(sucursalId) : undefined);
  }

  // Devuelve la planilla CON sus pagos
  @Get("planillas/:id")
  verPlanilla(@Param("id", ParseIntPipe) id: number) { return this.svc.verPlanilla(id); }

  @Post("planillas")
  crearPlanilla(@Body() dto: CreatePlanillaDto) { return this.svc.crearPlanilla(dto); }

  @Patch("planillas/:id/cerrar")
  cerrarPlanilla(@Param("id", ParseIntPipe) id: number) { return this.svc.cerrarPlanilla(id); }

  //  PAGOS 
  @Post("pagos-planilla")
  registrarPago(@Body() dto: CreatePagoDto) { return this.svc.registrarPago(dto); }

  //  CONSOLIDADOS 
  // GET /gasto-personal/sucursal?periodo=2026-09
  @Get("gasto-personal/sucursal")
  gastoPorSucursal(@Query("periodo") periodo: string) {
    return this.svc.gastoPorSucursal(periodo);
  }

  // GET /gasto-personal/tipo?periodo=2026-09
  @Get("gasto-personal/tipo")
  gastoPorTipo(@Query("periodo") periodo: string) {
    return this.svc.gastoPorTipo(periodo);
  }
}