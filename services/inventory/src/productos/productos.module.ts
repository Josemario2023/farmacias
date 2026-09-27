import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Producto } from "./producto.entity";
import { Categoria } from "../categorias/categoria.entity";
import { ProductosService } from "./productos.service";
import { ProductosController } from "./productos.controller";

@Module({
  imports: [TypeOrmModule.forFeature([Producto, Categoria])],
  controllers: [ProductosController],
  providers: [ProductosService],
})
export class ProductosModule {}