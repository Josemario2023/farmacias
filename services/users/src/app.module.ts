import { Module } from "@nestjs/common";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { TypeOrmModule } from "@nestjs/typeorm";
import { ClientsModule, Transport } from "@nestjs/microservices";
import { AppController } from "./app.controller";
import { AppService } from "./app.service";
import { Usuario } from "./usuarios/usuario.entity";
import { UsuariosModule } from "./usuarios/usuarios.module";
import { AuthModule } from "./auth/auth.module";
import { OtpCodigo } from "./auth/otp-codigo.entity";
import { Region } from "./regiones/region.entity";
import { RegionesModule } from "./regiones/regiones.module";
import { Sucursal } from "./sucursales/sucursal.entity";
import { SucursalesModule } from "./sucursales/sucursales.module";
import { Rol } from "./roles/rol.entity";
import { Permiso } from "./permisos/permiso.entity";
import { RolesModule } from "./roles/roles.module";
import { PermisosModule } from "./permisos/permisos.module";
import { UsuarioRol } from "./asignaciones/usuario-rol.entity";
import { RolPermiso } from "./asignaciones/rol-permiso.entity";
import { UsuarioSucursal } from "./asignaciones/usuario-sucursal.entity";
import { AsignacionesModule } from "./asignaciones/asignaciones.module";

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
        entities: [Usuario,OtpCodigo, Region,Sucursal,Rol,Permiso, UsuarioRol, RolPermiso, UsuarioSucursal],
        synchronize: false,
      }),
    }),
    ClientsModule.registerAsync([
      {
        name: "RABBITMQ_CLIENT",
        inject: [ConfigService],
        useFactory: (config: ConfigService) => ({
          transport: Transport.RMQ,
          options: {
            urls: [config.get<string>("RABBITMQ_URL") ?? "amqp://localhost:5672"],
            queue: "inventory_queue",
            queueOptions: { durable: true },
          },
        }),
      },
    ]),
    UsuariosModule,
    AuthModule,
    RegionesModule, RegionesModule,SucursalesModule, RolesModule, PermisosModule, AsignacionesModule, ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}