import { Module } from "@nestjs/common";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { TypeOrmModule } from "@nestjs/typeorm";
import { AppController } from "./app.controller";
import { AppService } from "./app.service";
import { CategoriaActivo } from "./activos/categoria-activo.entity";
import { ActivoFijo } from "./activos/activo-fijo.entity";
import { Depreciacion } from "./activos/depreciacion.entity";
import { ActivosModule } from "./activos/activos.module";

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
        entities: [CategoriaActivo, ActivoFijo, Depreciacion],
        synchronize: false,
      }),
    }),
    ActivosModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}