import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Sucursal } from "./sucursal.entity";
import { Region } from "../regiones/region.entity";
import { SucursalesService } from "./sucursales.service";
import { SucursalesController } from "./sucursales.controller";

@Module({
  // Registra AMBAS entidades: el service necesita consultar regiones
  imports: [TypeOrmModule.forFeature([Sucursal, Region])],
  controllers: [SucursalesController],
  providers: [SucursalesService],
})
export class SucursalesModule {}