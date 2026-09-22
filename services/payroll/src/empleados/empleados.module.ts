import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Empleado } from "./empleado.entity";
import { EmpleadosService } from "./empleados.service";
import { EmpleadosController } from "./empleados.controller";

@Module({
  imports: [TypeOrmModule.forFeature([Empleado])],
  controllers: [EmpleadosController],
  providers: [EmpleadosService],
})
export class EmpleadosModule {}
