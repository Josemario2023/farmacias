import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Venta } from "./venta.entity";
import { VentasService } from "./ventas.service";
import { VentasController } from "./ventas.controller";
import { PublisherService } from "../messaging/publisher.service";

@Module({
  imports: [TypeOrmModule.forFeature([Venta])],
  controllers: [VentasController],
  providers: [VentasService, PublisherService],  // agregamos el publisher
})
export class VentasModule {}