import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { ConsolidadoVentas } from "./consolidado-ventas.entity";
import { Hallazgo } from "./hallazgo.entity";
import { ConsolidadosService } from "./consolidados.service";
import { ConsolidadosController } from "./consolidados.controller";

@Module({
  imports: [TypeOrmModule.forFeature([ConsolidadoVentas, Hallazgo])],
  controllers: [ConsolidadosController],
  providers: [ConsolidadosService],
  exports: [ConsolidadosService],   // el consumidor de eventos lo usará
})
export class ConsolidadosModule {}