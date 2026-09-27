import { Controller, Get, Post, Patch, Body, Param, ParseIntPipe } from "@nestjs/common";
import { TrasladosService } from "./traslados.service";
import { CreateTrasladoFormalDto } from "./create-traslado-formal.dto";
import { EnviarTrasladoDto, RecibirTrasladoDto } from "./mover-traslado.dto";

@Controller("traslados-formales")
export class TrasladosController {
  constructor(private readonly trasladosService: TrasladosService) {}

  @Get()
  findAll() { return this.trasladosService.findAll(); }

  // Devuelve el traslado CON sus lineas
  @Get(":id")
  findOne(@Param("id", ParseIntPipe) id: number) { return this.trasladosService.findOne(id); }

  // 1) SOLICITAR
  @Post()
  solicitar(@Body() dto: CreateTrasladoFormalDto) { return this.trasladosService.solicitar(dto); }

  // 2) AUTORIZAR
  @Patch(":id/autorizar")
  autorizar(@Param("id", ParseIntPipe) id: number, @Body() body: { usuarioId: number }) {
    return this.trasladosService.autorizar(id, body.usuarioId);
  }

  // 3) ENVIAR -> sale el stock del origen
  @Post(":id/enviar")
  enviar(@Param("id", ParseIntPipe) id: number, @Body() dto: EnviarTrasladoDto) {
    return this.trasladosService.enviar(id, dto);
  }

  // 4) RECIBIR -> entra el stock al destino
  @Post(":id/recibir")
  recibir(@Param("id", ParseIntPipe) id: number, @Body() dto: RecibirTrasladoDto) {
    return this.trasladosService.recibir(id, dto);
  }

  @Patch(":id/anular")
  anular(@Param("id", ParseIntPipe) id: number) { return this.trasladosService.anular(id); }
}