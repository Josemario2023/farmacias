import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Region } from "./region.entity";
import { RegionesService } from "./regiones.service";
import { RegionesController } from "./regiones.controller";

@Module({
  imports: [TypeOrmModule.forFeature([Region])],
  controllers: [RegionesController],
  providers: [RegionesService],
  exports: [TypeOrmModule],   // para que SUCURSAL pueda usar Region despues
})
export class RegionesModule {}