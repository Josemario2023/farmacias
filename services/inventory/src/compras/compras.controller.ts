import { Controller, Get, Post, Patch, Body, Param, ParseIntPipe } from "@nestjs/common";
import { ComprasService } from "./compras.service";
import { CreateOrdenDto } from "./create-orden.dto";
import { RecibirOrdenDto } from "./recibir-orden.dto";

@Controller("ordenes-compra")
export class ComprasController {
  constructor(private readonly comprasService: ComprasService) {}

  @Get()
  findAll() { return this.comprasService.findAll(); }

  // Devuelve la orden CON sus lineas
  @Get(":id")
  findOne(@Param("id", ParseIntPipe) id: number) { return this.comprasService.findOne(id); }

  // POST /ordenes-compra -> crea en estado BORRADOR
  @Post()
  create(@Body() dto: CreateOrdenDto) { return this.comprasService.create(dto); }

  // PATCH /ordenes-compra/1/autorizar -> BORRADOR a AUTORIZADA
  @Patch(":id/autorizar")
  autorizar(@Param("id", ParseIntPipe) id: number) { return this.comprasService.autorizar(id); }

  // POST /ordenes-compra/1/recibir -> entra al KARDEX y sube el stock
  @Post(":id/recibir")
  recibir(@Param("id", ParseIntPipe) id: number, @Body() dto: RecibirOrdenDto) {
    return this.comprasService.recibir(id, dto);
  }

  @Patch(":id/anular")
  anular(@Param("id", ParseIntPipe) id: number) { return this.comprasService.anular(id); }
}