import { Controller, Get } from "@nestjs/common";
import { EventosService } from "./eventos.service";
import { Evento } from "./evento.entity";

@Controller("eventos")
export class EventosController {
  constructor(private readonly eventosService: EventosService) {}

  @Get()
  findAll(): Promise<Evento[]> {
    return this.eventosService.findAll();
  }
}
