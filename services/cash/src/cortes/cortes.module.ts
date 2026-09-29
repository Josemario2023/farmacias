import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { CorteCaja } from "./corte-caja.entity";
import { Caja } from "./caja.entity";
import { MovimientoCaja } from "./movimiento-caja.entity";
import { CortesService } from "./cortes.service";
import { CortesController } from "./cortes.controller";
import { PublisherService } from "../messaging/publisher.service";

@Module({
  imports: [TypeOrmModule.forFeature([CorteCaja, Caja, MovimientoCaja])],
  controllers: [CortesController],
  providers: [CortesService, PublisherService],
  exports: [CortesService],
})
export class CortesModule {}