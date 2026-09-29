import { Injectable, OnModuleInit } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import * as amqp from "amqplib";
import { CotizacionesService } from "../cotizaciones/cotizaciones.service";

const EXCHANGE = "farmacias.events";
const QUEUE = "delivery_queue";

@Injectable()
export class ConsumerService implements OnModuleInit {
  private connection: any;
  private channel: any;

  constructor(
    private readonly config: ConfigService,
    private readonly cotizacionesService: CotizacionesService,
  ) {}

  async onModuleInit() {
    const url = this.config.get<string>("RABBITMQ_URL") ?? "amqp://localhost:5672";
    this.connection = await amqp.connect(url);
    this.channel = await this.connection.createChannel();

    await this.channel.assertExchange(EXCHANGE, "fanout", { durable: true });
    await this.channel.assertQueue(QUEUE, { durable: true });
    await this.channel.bindQueue(QUEUE, EXCHANGE, "");

    console.log(">>> delivery suscrito al exchange, escuchando", QUEUE);

    this.channel.consume(QUEUE, async (msg: any) => {
      if (!msg) return;
      try {
        const contenido = JSON.parse(msg.content.toString());
        await this.procesar(contenido);
      } catch (e) {
        console.error(">>> delivery: error procesando evento", e);
      }
      this.channel.ack(msg);
    });
  }

  async procesar(mensaje: any) {
    const { tipoEvento, data } = mensaje;

    // Solo nos interesan los cambios de stock
    if (tipoEvento !== "StockChanged") return;

    await this.cotizacionesService.actualizarDisponibilidad({
      sucursalId: data.sucursalId,
      productoId: data.productoId,
      nombreProducto: data.nombreProducto,
      cantidadDisponible: data.cantidadDisponible,
      precio: data.precio,
    });

    console.log(
      ">>> delivery ACTUALIZO disponibilidad: producto " + data.productoId +
      " en sucursal " + data.sucursalId + " = " + data.cantidadDisponible + " unidades",
    );
  }
}