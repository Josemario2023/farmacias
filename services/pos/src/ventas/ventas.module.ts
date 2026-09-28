import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { HttpModule } from "@nestjs/axios";
import { Venta } from "./venta.entity";
import { VentaDetalle } from "./venta-detalle.entity";
import { Pago } from "./pago.entity";
import { VentasService } from "./ventas.service";
import { VentasController } from "./ventas.controller";
import { PublisherService } from "../messaging/publisher.service";

@Module({
  imports: [
    TypeOrmModule.forFeature([Venta, VentaDetalle, Pago]),
    HttpModule,   // para llamar a inventory por HTTP
  ],
  controllers: [VentasController],
  providers: [VentasService, PublisherService],
})
export class VentasModule {}