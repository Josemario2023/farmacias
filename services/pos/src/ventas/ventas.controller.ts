import { Controller, Get, Post, Patch, Body, Param, ParseIntPipe } from "@nestjs/common";
import { VentasService } from "./ventas.service";
import { CreateVentaDto } from "./create-venta.dto";

@Controller("ventas")
export class VentasController {
  constructor(private readonly ventasService: VentasService) {}

  @Get()
  findAll() { return this.ventasService.findAll(); }

  // Devuelve la venta CON sus lineas y pagos
  @Get(":id")
  findOne(@Param("id", ParseIntPipe) id: number) { return this.ventasService.findOne(id); }

  // POST /ventas -> valida stock, descuenta, guarda y publica el evento
  @Post()
  crear(@Body() dto: CreateVentaDto) { return this.ventasService.crearVenta(dto); }

  // PATCH /ventas/1/anular -> devuelve el stock al inventario
  @Patch(":id/anular")
  anular(@Param("id", ParseIntPipe) id: number, @Body() body: { usuarioId: number }) {
    return this.ventasService.anular(id, body.usuarioId);
  }
}
