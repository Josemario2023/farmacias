import { Module } from "@nestjs/common";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { TypeOrmModule } from "@nestjs/typeorm";
import { AppController } from "./app.controller";
import { AppService } from "./app.service";
import { Empleado } from "./empleados/empleado.entity";
import { EmpleadosModule } from "./empleados/empleados.module";

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
        entities: [Empleado],
        synchronize: false,
      }),
    }),
    EmpleadosModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
