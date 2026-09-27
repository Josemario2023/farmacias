import { Controller, Get, Post, Patch, Delete, Body, Param, Query, ParseIntPipe } from "@nestjs/common";
import { ProveedoresService } from "./proveedores.service";
import { CreateProveedorDto } from "./create-proveedor.dto";
import { UpdateProveedorDto } from "./update-proveedor.dto";

@Controller("proveedores")
export class ProveedoresController {
  constructor(private readonly proveedoresService: ProveedoresService) {}

  @Get()
  findAll(@Query("buscar") buscar?: string) {
    if (buscar) return this.proveedoresService.buscar(buscar);
    return this.proveedoresService.findAll();
  }

  @Get(":id")
  findOne(@Param("id", ParseIntPipe) id: number) { return this.proveedoresService.findOne(id); }

  @Post()
  create(@Body() dto: CreateProveedorDto) { return this.proveedoresService.create(dto); }

  @Patch(":id")
  update(@Param("id", ParseIntPipe) id: number, @Body() dto: UpdateProveedorDto) {
    return this.proveedoresService.update(id, dto);
  }

  @Delete(":id")
  desactivar(@Param("id", ParseIntPipe) id: number) { return this.proveedoresService.desactivar(id); }
}