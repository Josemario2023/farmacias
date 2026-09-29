import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Disponibilidad } from "../disponibilidad/disponibilidad.entity";
import { CoberturaSucursal } from "./cobertura.entity";
import { FormaPagoSucursal } from "./forma-pago.entity";
import { Cotizacion } from "./cotizacion.entity";
import { CotizacionesService } from "./cotizaciones.service";
import { CotizacionesController } from "./cotizaciones.controller";

@Module({
  imports: [
    TypeOrmModule.forFeature([Disponibilidad, CoberturaSucursal, FormaPagoSucursal, Cotizacion]),
  ],
  controllers: [CotizacionesController],
  providers: [CotizacionesService],
  exports: [CotizacionesService],
})
export class CotizacionesModule {}