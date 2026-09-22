import { Controller, Get } from "@nestjs/common";
import { CortesService } from "./cortes.service";
import { CorteCaja } from "./corte-caja.entity";

// @Controller("cortes") -> todas las rutas de aqui empiezan con /cortes
// (equivale a [Route("cortes")] en ASP.NET)
@Controller("cortes")
export class CortesController {
  // Inyectamos el service para delegarle el trabajo.
  constructor(private readonly cortesService: CortesService) {}

  // @Get() -> responde a GET /cortes  (como [HttpGet])
  // El controller NO tiene logica: solo llama al service. Se mantiene "delgado".
  @Get()
  findAll(): Promise<CorteCaja[]> {
    return this.cortesService.findAll();
  }
}
