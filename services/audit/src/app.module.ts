import { Module } from "@nestjs/common";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { TypeOrmModule } from "@nestjs/typeorm";
import { AppController } from "./app.controller";
import { AppService } from "./app.service";
import { Evento } from "./eventos/evento.entity";
import { EventosModule } from "./eventos/eventos.module";
import { ConsumerService } from "./messaging/consumer.service";

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
        entities: [Evento],
        synchronize: false,
      }),
    }),
    TypeOrmModule.forFeature([Evento]),
    EventosModule,
  ],
  controllers: [AppController],   // quitamos SaleConsumer de aqui
  providers: [AppService, ConsumerService],  // agregamos ConsumerService
})
export class AppModule {}