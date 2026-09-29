import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { CategoriaActivo } from "./categoria-activo.entity";
import { ActivoFijo } from "./activo-fijo.entity";
import { Depreciacion } from "./depreciacion.entity";
import { ActivosService } from "./activos.service";
import { ActivosController } from "./activos.controller";

@Module({
  imports: [TypeOrmModule.forFeature([CategoriaActivo, ActivoFijo, Depreciacion])],
  controllers: [ActivosController],
  providers: [ActivosService],
})
export class ActivosModule {}