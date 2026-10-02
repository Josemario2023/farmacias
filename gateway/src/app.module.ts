import { Module } from "@nestjs/common";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { ThrottlerModule, ThrottlerGuard } from "@nestjs/throttler";
import { JwtModule } from "@nestjs/jwt";
import { APP_GUARD } from "@nestjs/core";
import { AppController } from "./app.controller";
import { AppService } from "./app.service";
import { ProxyModule } from "./proxy/proxy.module";
import { JwtAuthGuard } from "./auth/jwt-auth.guard";
import { PermisosGuard } from "./auth/permisos.guard";

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ThrottlerModule.forRoot([{ ttl: 60000, limit: 200 }]),
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.get<string>("JWT_SECRET"),
      }),
    }),
    ProxyModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    { provide: APP_GUARD, useClass: ThrottlerGuard },   // rate limiting
    { provide: APP_GUARD, useClass: JwtAuthGuard },     // autenticacion JWT
    { provide: APP_GUARD, useClass: PermisosGuard },
  ],
})
export class AppModule {}