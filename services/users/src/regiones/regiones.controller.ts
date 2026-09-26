import { Controller, Get, Post, Patch, Delete, Body, Param, ParseIntPipe } from "@nestjs/common";
import { RegionesService } from "./regiones.service";
import { CreateRegionDto } from "./create-region.dto";
import { UpdateRegionDto } from "./update-region.dto";

@Controller("regiones")
export class RegionesController {
  constructor(private readonly regionesService: RegionesService) {}

  @Get()                                    // GET /regiones
  findAll() {
    return this.regionesService.findAll();
  }

  @Get(":id")                               // GET /regiones/1
  findOne(@Param("id", ParseIntPipe) id: number) {
    return this.regionesService.findOne(id);
  }

  @Post()                                   // POST /regiones
  create(@Body() dto: CreateRegionDto) {
    return this.regionesService.create(dto);
  }

  @Patch(":id")                             // PATCH /regiones/1
  update(@Param("id", ParseIntPipe) id: number, @Body() dto: UpdateRegionDto) {
    return this.regionesService.update(id, dto);
  }

  @Delete(":id")                            // DELETE /regiones/1 (baja logica)
  desactivar(@Param("id", ParseIntPipe) id: number) {
    return this.regionesService.desactivar(id);
  }
}