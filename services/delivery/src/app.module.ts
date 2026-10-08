import { Module } from "@nestjs/common";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { TypeOrmModule } from "@nestjs/typeorm";
import { AppController } from "./app.controller";
import { AppService } from "./app.service";
import { Disponibilidad } from "./disponibilidad/disponibilidad.entity";
import { DisponibilidadModule } from "./disponibilidad/disponibilidad.module";
import { CoberturaSucursal } from "./cotizaciones/cobertura.entity";
import { FormaPagoSucursal } from "./cotizaciones/forma-pago.entity";
import { Cotizacion } from "./cotizaciones/cotizacion.entity";
import { CotizacionesModule } from "./cotizaciones/cotizaciones.module";
import { ConsumerService } from "./messaging/consumer.service";
import { CotizacionDetalle } from "./cotizaciones/cotizacion-detalle.entity";

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: "oracle",
        host: config.get<string>("DB_HOST"),
        port: config.get<number>("DB_PORT"),
        serviceName: config.get<string>("DB_SERVICE"),
        username: config.get<string>("DB_USER"),
        password: config.get<string>("DB_PASSWORD"),
        entities: [Disponibilidad, CoberturaSucursal, FormaPagoSucursal,Cotizacion, CotizacionDetalle],
        synchronize: false,
      }),
    }),
    DisponibilidadModule,
    CotizacionesModule,
  ],
  controllers: [AppController],
  providers: [AppService, ConsumerService],
})
export class AppModule {}