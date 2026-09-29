import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { ConsolidadoVentas } from "./consolidado-ventas.entity";
import { Hallazgo } from "./hallazgo.entity";
import { ConsolidadosService } from "./consolidados.service";
import { ConsolidadosController } from "./consolidados.controller";
import { ConsolidadoInventario } from "./consolidado-inventario.entity";
import { ConsolidadoCaja } from "./consolidado-caja.entity";

@Module({
  imports: [TypeOrmModule.forFeature([ConsolidadoVentas, Hallazgo,ConsolidadoCaja, ConsolidadoInventario])],
  controllers: [ConsolidadosController],
  providers: [ConsolidadosService],
  exports: [ConsolidadosService],   // el consumidor de eventos lo usará
})
export class ConsolidadosModule {}