import { Controller, Get, Post, Body, Query } from "@nestjs/common";
import { ClientesService } from "./clientes.service";
import { CreateClienteDto } from "./cliente.dto";

@Controller("clientes")
export class ClientesController {
  constructor(private readonly clientesService: ClientesService) {}

  // GET /clientes            -> todos
  // GET /clientes?nit=1234-5 -> el que tenga ese NIT
  @Get()
  buscar(@Query("nit") nit?: string) { return this.clientesService.buscar(nit); }

  @Post()
  crear(@Body() dto: CreateClienteDto) { return this.clientesService.crear(dto); }
}