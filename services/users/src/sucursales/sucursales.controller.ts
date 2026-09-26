import { Controller, Get, Post, Patch, Delete, Body, Param, ParseIntPipe, Query } from "@nestjs/common";
import { SucursalesService } from "./sucursales.service";
import { CreateSucursalDto } from "./create-sucursal.dto";
import { UpdateSucursalDto } from "./update-sucursal.dto";

@Controller("sucursales")
export class SucursalesController {
  constructor(private readonly sucursalesService: SucursalesService) {}

  // GET /sucursales          -> todas
  // GET /sucursales?regionId=1 -> solo las de esa region
  @Get()
  findAll(@Query("regionId") regionId?: string) {
    if (regionId) {
      return this.sucursalesService.findByRegion(Number(regionId));
    }
    return this.sucursalesService.findAll();
  }

  @Get(":id")
  findOne(@Param("id", ParseIntPipe) id: number) {
    return this.sucursalesService.findOne(id);
  }

  @Post()
  create(@Body() dto: CreateSucursalDto) {
    return this.sucursalesService.create(dto);
  }

  @Patch(":id")
  update(@Param("id", ParseIntPipe) id: number, @Body() dto: UpdateSucursalDto) {
    return this.sucursalesService.update(id, dto);
  }

  @Delete(":id")
  desactivar(@Param("id", ParseIntPipe) id: number) {
    return this.sucursalesService.desactivar(id);
  }
}