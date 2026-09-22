import { Controller, Get } from "@nestjs/common";
import { EmpleadosService } from "./empleados.service";
import { Empleado } from "./empleado.entity";

@Controller("empleados")
export class EmpleadosController {
  constructor(private readonly empleadosService: EmpleadosService) {}

  @Get()
  findAll(): Promise<Empleado[]> {
    return this.empleadosService.findAll();
  }
}
