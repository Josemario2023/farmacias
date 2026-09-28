import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Factura } from "./factura.entity";
import { FacturaDetalle } from "./factura-detalle.entity";
import { SerieFactura } from "./serie-factura.entity";
import { FacturasService } from "./facturas.service";
import { FacturasController } from "./facturas.controller";

@Module({
  imports: [TypeOrmModule.forFeature([Factura, FacturaDetalle, SerieFactura])],
  controllers: [FacturasController],
  providers: [FacturasService],
  exports: [FacturasService],   // el consumidor de eventos lo usara
})
export class FacturasModule {}