import { Controller, Get, Post, Patch, Delete, Body, Param, Query, ParseIntPipe } from "@nestjs/common";
import { ProductosService } from "./productos.service";
import { CreateProductoDto } from "./create-producto.dto";
import { UpdateProductoDto } from "./update-producto.dto";

@Controller("productos")
export class ProductosController {
  constructor(private readonly productosService: ProductosService) {}

  // GET /productos          -> todos
  // GET /productos?buscar=aceta -> busca por nombre o codigo (para el POS)
  @Get()
  findAll(@Query("buscar") buscar?: string) {
    if (buscar) {
      return this.productosService.buscar(buscar);
    }
    return this.productosService.findAll();
  }

  @Get(":id")
  findOne(@Param("id", ParseIntPipe) id: number) {
    return this.productosService.findOne(id);
  }

  @Post()
  create(@Body() dto: CreateProductoDto) {
    return this.productosService.create(dto);
  }

  @Patch(":id")
  update(@Param("id", ParseIntPipe) id: number, @Body() dto: UpdateProductoDto) {
    return this.productosService.update(id, dto);
  }

  @Delete(":id")
  desactivar(@Param("id", ParseIntPipe) id: number) {
    return this.productosService.desactivar(id);
  }
}