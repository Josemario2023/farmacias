import { Module } from "@nestjs/common";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { TypeOrmModule } from "@nestjs/typeorm";
import { AppController } from "./app.controller";
import { AppService } from "./app.service";
import { Producto } from "./productos/producto.entity";
import { ProductosModule } from "./productos/productos.module";
import { ConsumerService } from "./messaging/consumer.service";
import { Categoria } from "./categorias/categoria.entity";
import { CategoriasModule } from "./categorias/categorias.module";
import { Lote } from "./lotes/lote.entity";
import { LotesModule } from "./lotes/lotes.module";
import { MovimientoInv } from "./kardex/movimiento.entity";
import { Existencia } from "./kardex/existencia.entity";
import { KardexModule } from "./kardex/kardex.module";
import { PoliticaStock } from "./politicas/politica-stock.entity";
import { PoliticasModule } from "./politicas/politicas.module";
import { Proveedor } from "./proveedores/proveedor.entity";
import { ProveedoresModule } from "./proveedores/proveedores.module";
import { OrdenCompra } from "./compras/orden-compra.entity";
import { OrdenCompraDetalle } from "./compras/orden-detalle.entity";
import { ComprasModule } from "./compras/compras.module";

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: "oracle",
        host: config.get<string>("DB_HOST"),
        port: config.get<number>("DB_PORT"),
        serviceName: config.get<string>("DB_SERVICE"),
        username: config.get<string>("DB_USER"),
        password: config.get<string>("DB_PASSWORD"),
        entities: [Producto,Categoria,Lote, MovimientoInv,Existencia, PoliticaStock,Proveedor, OrdenCompra,OrdenCompraDetalle],
        synchronize: false,
      }),
    }),
    ProductosModule,
    CategoriasModule,
    LotesModule,
    KardexModule,
    PoliticasModule,
    ProductosModule,
    ProveedoresModule,
    ComprasModule,
  ],
  controllers: [AppController],   // quitamos EventsController (era de la prueba ping)
  providers: [AppService, ConsumerService],
})
export class AppModule {}
