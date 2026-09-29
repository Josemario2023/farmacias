import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Empleado } from "../empleados/empleado.entity";
import { Planilla } from "./planilla.entity";
import { PagoPlanilla } from "./pago-planilla.entity";
import { PlanillasService } from "./planillas.service";
import { PlanillasController } from "./planillas.controller";

@Module({
  imports: [TypeOrmModule.forFeature([Empleado, Planilla, PagoPlanilla])],
  controllers: [PlanillasController],
  providers: [PlanillasService],
})
export class PlanillasModule {}