import { Injectable, OnModuleInit, OnModuleDestroy } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import * as amqp from "amqplib";

const EXCHANGE = "farmacias.events";

@Injectable()
export class PublisherService implements OnModuleInit, OnModuleDestroy {
  // Sin anotar el tipo: dejamos que TypeScript lo infiera (evita el choque de versiones)
  private connection: any;
  private channel: any;

  constructor(private readonly config: ConfigService) {}

  async onModuleInit() {
    const url = this.config.get<string>("RABBITMQ_URL") ?? "amqp://localhost:5672";
    this.connection = await amqp.connect(url);
    this.channel = await this.connection.createChannel();

    await this.channel.assertExchange(EXCHANGE, "fanout", { durable: true });
    console.log(">>> POS conectado al exchange", EXCHANGE);
  }

  publish(tipoEvento: string, data: any) {
    const mensaje = { tipoEvento, data };
    const buffer = Buffer.from(JSON.stringify(mensaje));
    this.channel.publish(EXCHANGE, "", buffer);
    console.log(">>> POS publico evento:", tipoEvento);
  }

  async onModuleDestroy() {
    await this.channel?.close();
    await this.connection?.close();
  }
}
