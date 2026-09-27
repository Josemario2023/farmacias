import { Controller, Get, Post, Body, Param, Query, ParseIntPipe } from "@nestjs/common";
import { LotesService } from "./lotes.service";
import { CreateLoteDto } from "./create-lote.dto";

@Controller("lotes")
export class LotesController {
  constructor(private readonly lotesService: LotesService) {}

  // GET /lotes                    -> todos
  // GET /lotes?productoId=1       -> lotes de un producto (orden FIFO)
  // GET /lotes?porVencer=60       -> alerta: los que vencen en 60 dias
  @Get()
  findAll(
    @Query("productoId") productoId?: string,
    @Query("porVencer") porVencer?: string,
  ) {
    if (porVencer) {
      return this.lotesService.porVencer(Number(porVencer));
    }
    if (productoId) {
      return this.lotesService.findByProducto(Number(productoId));
    }
    return this.lotesService.findAll();
  }

  @Get(":id")
  findOne(@Param("id", ParseIntPipe) id: number) {
    return this.lotesService.findOne(id);
  }

  @Post()
  create(@Body() dto: CreateLoteDto) {
    return this.lotesService.create(dto);
  }
}