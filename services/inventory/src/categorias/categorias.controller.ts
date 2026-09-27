import { Controller, Get, Post, Patch, Delete, Body, Param, ParseIntPipe } from "@nestjs/common";
import { CategoriasService } from "./categorias.service";
import { CreateCategoriaDto } from "./create-categoria.dto";

@Controller("categorias")
export class CategoriasController {
  constructor(private readonly categoriasService: CategoriasService) {}

  @Get()
  findAll() { return this.categoriasService.findAll(); }

  @Get(":id")
  findOne(@Param("id", ParseIntPipe) id: number) { return this.categoriasService.findOne(id); }

  @Post()
  create(@Body() dto: CreateCategoriaDto) { return this.categoriasService.create(dto); }

  @Patch(":id")
  update(@Param("id", ParseIntPipe) id: number, @Body() dto: CreateCategoriaDto) {
    return this.categoriasService.update(id, dto);
  }

  @Delete(":id")
  remove(@Param("id", ParseIntPipe) id: number) { return this.categoriasService.remove(id); }
}