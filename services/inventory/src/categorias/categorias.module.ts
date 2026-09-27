import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Categoria } from "./categoria.entity";
import { Producto } from "../productos/producto.entity";
import { CategoriasService } from "./categorias.service";
import { CategoriasController } from "./categorias.controller";

@Module({
  // Registra AMBAS: el service consulta productos para validar el borrado
  imports: [TypeOrmModule.forFeature([Categoria, Producto])],
  controllers: [CategoriasController],
  providers: [CategoriasService],
})
export class CategoriasModule {}