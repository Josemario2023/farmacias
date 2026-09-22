import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { CorteCaja } from "./corte-caja.entity";
import { CortesService } from "./cortes.service";
import { CortesController } from "./cortes.controller";

@Module({
  // forFeature registra el repositorio de CorteCaja para ESTE modulo,
  // haciendo que @InjectRepository(CorteCaja) funcione en el service.
  imports: [TypeOrmModule.forFeature([CorteCaja])],
  controllers: [CortesController],  // los controllers de este modulo
  providers: [CortesService],        // los services (inyectables) de este modulo
})
export class CortesModule {}
