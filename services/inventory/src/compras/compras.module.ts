import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { OrdenCompra } from "./orden-compra.entity";
import { OrdenCompraDetalle } from "./orden-detalle.entity";
import { Proveedor } from "../proveedores/proveedor.entity";
import { ComprasService } from "./compras.service";
import { ComprasController } from "./compras.controller";

@Module({
  imports: [TypeOrmModule.forFeature([OrdenCompra, OrdenCompraDetalle, Proveedor])],
  controllers: [ComprasController],
  providers: [ComprasService],
})
export class ComprasModule {}