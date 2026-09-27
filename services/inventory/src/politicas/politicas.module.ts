import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { PoliticaStock } from "./politica-stock.entity";
import { Producto } from "../productos/producto.entity";
import { PoliticasService } from "./politicas.service";
import { PoliticasController } from "./politicas.controller";


@Module({
  imports: [TypeOrmModule.forFeature([PoliticaStock, Producto])],
  controllers: [PoliticasController],
  providers: [PoliticasService],
})
export class PoliticasModule {}