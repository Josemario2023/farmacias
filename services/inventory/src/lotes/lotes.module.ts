import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Lote } from "./lote.entity";
import { Producto } from "../productos/producto.entity";
import { LotesService } from "./lotes.service";
import { LotesController } from "./lotes.controller";

@Module({
  imports: [TypeOrmModule.forFeature([Lote, Producto])],
  controllers: [LotesController],
  providers: [LotesService],
})
export class LotesModule {}