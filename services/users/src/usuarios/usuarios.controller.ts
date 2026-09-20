import { Controller, Get, Post, Body } from "@nestjs/common";
import { UsuariosService } from "./usuarios.service";
import { Usuario } from "./usuario.entity";
import { CreateUsuarioDto } from "./create-usuario.dto";

@Controller("usuarios")
export class UsuariosController {
  constructor(private readonly usuariosService: UsuariosService) {}

  @Get()                    // GET /usuarios
  findAll(): Promise<Usuario[]> {
    return this.usuariosService.findAll();
  }

  @Post()                   // POST /usuarios
  create(@Body() dto: CreateUsuarioDto): Promise<Usuario> {
    return this.usuariosService.create(dto);
  }
}
