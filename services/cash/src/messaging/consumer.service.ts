import { Injectable, OnModuleInit } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import * as amqp from "amqplib";

const EXCHANGE = "farmacias.events";
const QUEUE = "cash_queue";

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

    console.log(">>> cash suscrito al exchange, escuchando", QUEUE);

    this.channel.consume(QUEUE, async (msg: any) => {
      if (!msg) return;
      const contenido = JSON.parse(msg.content.toString());
      await this.procesar(contenido);
      this.channel.ack(msg);
    });
  }

  // Logica de cash: registrar el efectivo de la venta
  async procesar(mensaje: any) {
    const { tipoEvento, data } = mensaje;
    if (tipoEvento !== "SaleCreated") return;

    console.log(">>> cash RECIBIO venta:", data.numero);
    console.log(`    - registrar ingreso de $${data.total} en caja (sucursal ${data.sucursalId})`);
    console.log(">>> cash proceso el ingreso de efectivo");
  }
}
