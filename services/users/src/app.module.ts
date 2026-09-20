import { Module } from "@nestjs/common";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { TypeOrmModule } from "@nestjs/typeorm";
import { AppController } from "./app.controller";
import { AppService } from "./app.service";
import { Usuario } from "./usuarios/usuario.entity";
import { UsuariosModule } from "./usuarios/usuarios.module";
import { AuthModule } from "./auth/auth.module";

@Module({
  imports: [
    // Carga el .env y lo hace disponible en toda la app (como IConfiguration)
    ConfigModule.forRoot({ isGlobal: true }),

    // Configura la conexion a Oracle leyendo del .env
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: "oracle",
        host: config.get<string>("DB_HOST"),
        port: config.get<number>("DB_PORT"),
        serviceName: config.get<string>("DB_SERVICE"),
        username: config.get<string>("DB_USER"),
        password: config.get<string>("DB_PASSWORD"),
        entities: [Usuario],
        synchronize: false, // NUNCA true: las tablas ya existen, no queremos que las toque
      }),
    }),
    UsuariosModule,
    AuthModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}