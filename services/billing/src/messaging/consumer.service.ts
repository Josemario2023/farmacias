import { Injectable, OnModuleInit } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import * as amqp from "amqplib";
import { FacturasService } from "../facturas/facturas.service";

const EXCHANGE = "farmacias.events";
const QUEUE = "billing_queue";

@Injectable()
export class ConsumerService implements OnModuleInit {
  private connection: any;
  private channel: any;

  constructor(
    private readonly config: ConfigService,
    private readonly facturasService: FacturasService,
  ) {}

  async onModuleInit() {
    const url = this.config.get<string>("RABBITMQ_URL") ?? "amqp://localhost:5672";
    this.connection = await amqp.connect(url);
    this.channel = await this.connection.createChannel();

    await this.channel.assertExchange(EXCHANGE, "fanout", { durable: true });
    await this.channel.assertQueue(QUEUE, { durable: true });
    await this.channel.bindQueue(QUEUE, EXCHANGE, "");

    console.log(">>> billing suscrito al exchange, escuchando", QUEUE);

    this.channel.consume(QUEUE, async (msg: any) => {
      if (!msg) return;
      try {
        const contenido = JSON.parse(msg.content.toString());
        await this.procesar(contenido);
      } catch (e) {
        console.error(">>> billing: error procesando evento", e);
      }
      this.channel.ack(msg);
    });
  }

  // ============================================================
  // Al recibir una venta: emitir la factura automaticamente
  // ============================================================
  async procesar(mensaje: any) {
    const { tipoEvento, data } = mensaje;
    if (tipoEvento !== "SaleCreated") return;

    console.log(">>> billing RECIBIO venta:", data.numero);

    // 1) Buscar la serie activa de esa sucursal
    const serie = await this.facturasService.serieDeSucursal(data.sucursalId);
    if (!serie) {
      console.warn(
        "    ALERTA: no hay serie de facturacion activa en la sucursal " +
        data.sucursalId + ". La venta " + data.numero + " no se facturo.",
      );
      return;
    }

    // 2) Armar las lineas de la factura desde los items de la venta
    const lineas = (data.items ?? []).map((item: any) => ({
      productoId: item.productoId,
      descripcion: "Producto " + item.productoId,
      cantidad: item.cantidad,
      precioUnitario: item.precioUnitario,
    }));

    if (lineas.length === 0) {
      console.warn("    (venta sin items: no se factura)");
      return;
    }

    // 3) Emitir la factura
    try {
      const factura = await this.facturasService.emitir({
        serieId: serie.serieId,
        sucursalId: data.sucursalId,
        ventaId: data.ventaId,
        clienteId: data.clienteId,
        lineas,
      });
      console.log(
        "    Factura emitida: " + serie.serie + "-" + factura.numero +
        " (total " + factura.total + ")",
      );
    } catch (e: any) {
      console.error("    No se pudo facturar la venta " + data.numero + ": " + e.message);
    }
  }
}
