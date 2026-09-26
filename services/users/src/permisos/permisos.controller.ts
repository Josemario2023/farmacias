import { Controller, Get, Post, Patch, Delete, Body, Param, ParseIntPipe } from "@nestjs/common";
import { PermisosService } from "./permisos.service";
import { CreatePermisoDto } from "./create-permiso.dto";

@Controller("permisos")
export class PermisosController {
  constructor(private readonly permisosService: PermisosService) {}

  @Get()
  findAll() { return this.permisosService.findAll(); }

  @Get(":id")
  findOne(@Param("id", ParseIntPipe) id: number) { return this.permisosService.findOne(id); }

  @Post()
  create(@Body() dto: CreatePermisoDto) { return this.permisosService.create(dto); }

  @Patch(":id")
  update(@Param("id", ParseIntPipe) id: number, @Body() dto: CreatePermisoDto) {
    return this.permisosService.update(id, dto);
  }

  @Delete(":id")
  remove(@Param("id", ParseIntPipe) id: number) { return this.permisosService.remove(id); }
}