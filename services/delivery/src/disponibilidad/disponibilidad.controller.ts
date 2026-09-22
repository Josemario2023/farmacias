import { Controller, Get } from "@nestjs/common";
import { DisponibilidadService } from "./disponibilidad.service";
import { Disponibilidad } from "./disponibilidad.entity";

@Controller("disponibilidad")
export class DisponibilidadController {
  constructor(private readonly dispService: DisponibilidadService) {}

  @Get()
  findAll(): Promise<Disponibilidad[]> {
    return this.dispService.findAll();
  }
}
