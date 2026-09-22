import { Injectable, OnModuleInit } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import * as amqp from "amqplib";

const EXCHANGE = "farmacias.events";
const QUEUE = "inventory_queue";

@Injectable()
export class ConsumerService implements OnModuleInit {
  private connection: any;
  private channel: any;

  constructor(private readonly config: ConfigService) {}

  async onModuleInit() {
    const url = this.config.get<string>("RABBITMQ_URL") ?? "amqp://localhost:5672";
    this.connection = await amqp.connect(url);
    this.channel = await this.connection.createChannel();

    await this.channel.assertExchange(EXCHANGE, "fanout", { durable: true });
    await this.channel.assertQueue(QUEUE, { durable: true });
    await this.channel.bindQueue(QUEUE, EXCHANGE, "");

    console.log(">>> inventory suscrito al exchange, escuchando", QUEUE);

    this.channel.consume(QUEUE, async (msg: any) => {
      if (!msg) return;
      const contenido = JSON.parse(msg.content.toString());
      await this.procesar(contenido);
      this.channel.ack(msg);
    });
  }

  // Logica de inventory: descontar stock por cada item de la venta
  async procesar(mensaje: any) {
    const { tipoEvento, data } = mensaje;
    if (tipoEvento !== "SaleCreated") return;   // solo reacciona a ventas

    console.log(">>> inventory RECIBIO venta:", data.numero);

    // Por cada item de la venta, descontariamos su stock.
    // (Version inicial: lo logueamos; la resta real en EXISTENCIA crece despues)
    const items = data.items ?? [];
    if (items.length === 0) {
      console.log("    (venta sin items detallados; nada que descontar)");
    } else {
      for (const item of items) {
        console.log(`    - descontar ${item.cantidad} del producto ${item.productoId}`);
      }
    }
    console.log(">>> inventory proceso el descuento de stock");
  }
}
