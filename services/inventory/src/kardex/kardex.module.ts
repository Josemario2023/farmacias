import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { MovimientoInv } from "./movimiento.entity";
import { Existencia } from "./existencia.entity";
import { KardexService } from "./kardex.service";
import { KardexController } from "./kardex.controller";
import { PublisherService } from "../messaging/publisher.services";
import { publishBehavior } from "rxjs";

@Module({
  imports: [TypeOrmModule.forFeature([MovimientoInv, Existencia])],
  controllers: [KardexController],
  providers: [KardexService, PublisherService],
})
export class KardexModule {}