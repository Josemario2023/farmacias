import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Disponibilidad } from "./disponibilidad.entity";
import { DisponibilidadService } from "./disponibilidad.service";
import { DisponibilidadController } from "./disponibilidad.controller";

@Module({
  imports: [TypeOrmModule.forFeature([Disponibilidad])],
  controllers: [DisponibilidadController],
  providers: [DisponibilidadService],
})
export class DisponibilidadModule {}
