import { Module } from "@nestjs/common";
import { JwtModule } from "@nestjs/jwt";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Usuario } from "../usuarios/usuario.entity";
import { OtpCodigo } from "./otp-codigo.entity";
import { AuthService } from "./auth.service";
import { AuthController } from "./auth.controller";
import { OtpService } from "./otp.service";
import { MailService } from "./mail.service";

@Module({
  imports: [
    TypeOrmModule.forFeature([Usuario, OtpCodigo]),
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.get<string>("JWT_SECRET"),
        signOptions: { expiresIn: "8h" },
      }),
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, OtpService, MailService],
})
export class AuthModule {}
