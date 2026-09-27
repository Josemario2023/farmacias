import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Traslado } from "./traslado.entity";
import { TrasladoDetalle } from "./traslado-detalle.entity";
import { TrasladosService } from "./traslados.service";
import { TrasladosController } from "./traslados.controller";

@Module({
  imports: [TypeOrmModule.forFeature([Traslado, TrasladoDetalle])],
  controllers: [TrasladosController],
  providers: [TrasladosService],
})
export class TrasladosModule {}