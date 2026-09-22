import { Controller, Get, Post, Body } from "@nestjs/common";
import { VentasService } from "./ventas.service";
import { Venta } from "./venta.entity";

@Controller("ventas")
export class VentasController {
  constructor(private readonly ventasService: VentasService) {}

  @Get()
  findAll(): Promise<Venta[]> {
    return this.ventasService.findAll();
  }

  // POST /ventas -> crea la venta y dispara SaleCreated
  @Post()
  create(@Body() datos: any) {
    return this.ventasService.create(datos);
  }
}
