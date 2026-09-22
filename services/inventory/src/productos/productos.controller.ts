import { Controller, Get } from "@nestjs/common";
import { ProductosService } from "./productos.service";
import { Producto } from "./producto.entity";

@Controller("productos")
export class ProductosController {
  constructor(private readonly productosService: ProductosService) {}

  @Get()
  findAll(): Promise<Producto[]> {
    return this.productosService.findAll();
  }
}
