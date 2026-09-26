import { Controller, Get, Post, Patch, Delete, Body, Param, ParseIntPipe } from "@nestjs/common";
import { UsuariosService } from "./usuarios.service";
import { CreateUsuarioDto } from "./create-usuario.dto";
import { UpdateUsuarioDto } from "./update-usuario.dto";

@Controller("usuarios")
export class UsuariosController {
  constructor(private readonly usuariosService: UsuariosService) {}

  @Get()
  findAll() { return this.usuariosService.findAll(); }

  @Get(":id")
  findOne(@Param("id", ParseIntPipe) id: number) { return this.usuariosService.findOne(id); }

  @Post()
  create(@Body() dto: CreateUsuarioDto) { return this.usuariosService.create(dto); }

  @Patch(":id")
  update(@Param("id", ParseIntPipe) id: number, @Body() dto: UpdateUsuarioDto) {
    return this.usuariosService.update(id, dto);
  }

  @Delete(":id")
  desactivar(@Param("id", ParseIntPipe) id: number) {
    return this.usuariosService.desactivar(id);
  }
}
