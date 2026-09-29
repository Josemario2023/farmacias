import { Injectable, OnModuleInit } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import * as amqp from "amqplib";

const EXCHANGE = "farmacias.events";

@Injectable()
export class PublisherService implements OnModuleInit {
  private connection: any;
  private channel: any;

  constructor(private readonly config: ConfigService) {}

  async onModuleInit() {
    const url = this.config.get<string>("RABBITMQ_URL") ?? "amqp://localhost:5672";
    this.connection = await amqp.connect(url);
    this.channel = await this.connection.createChannel();
    await this.channel.assertExchange(EXCHANGE, "fanout", { durable: true });
    console.log(">>> inventory listo para publicar eventos");
  }

  publish(tipoEvento: string, data: any) {
    const mensaje = JSON.stringify({ tipoEvento, data });
    this.channel.publish(EXCHANGE, "", Buffer.from(mensaje));
    console.log(">>> inventory PUBLICO:", tipoEvento);
  }
}