import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Factura } from "./factura.entity";
import { FacturasService } from "./facturas.service";
import { FacturasController } from "./facturas.controller";

@Module({
  imports: [TypeOrmModule.forFeature([Factura])],
  controllers: [FacturasController],
  providers: [FacturasService],
})
export class FacturasModule {}
