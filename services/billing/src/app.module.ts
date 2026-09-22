import { Module } from "@nestjs/common";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { TypeOrmModule } from "@nestjs/typeorm";
import { AppController } from "./app.controller";
import { AppService } from "./app.service";
import { Factura } from "./facturas/factura.entity";
import { FacturasModule } from "./facturas/facturas.module";

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
        entities: [Factura],
        synchronize: false,
      }),
    }),
    FacturasModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}