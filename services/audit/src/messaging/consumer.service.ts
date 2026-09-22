import { Injectable, OnModuleInit } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import * as amqp from "amqplib";
import { Evento } from "../eventos/evento.entity";

const EXCHANGE = "farmacias.events";
const QUEUE = "audit_queue";

@Injectable()
export class ConsumerService implements OnModuleInit {
  private connection: any;
  private channel: any;

  constructor(
    private readonly config: ConfigService,
    @InjectRepository(Evento)
    private readonly eventoRepo: Repository<Evento>,
  ) {}

  async onModuleInit() {
    const url = this.config.get<string>("RABBITMQ_URL") ?? "amqp://localhost:5672";
    this.connection = await amqp.connect(url);
    this.channel = await this.connection.createChannel();

    // 1) Asegurar que el exchange existe (mismo tipo y nombre que POS)
    await this.channel.assertExchange(EXCHANGE, "fanout", { durable: true });
    // 2) Crear la cola propia de audit
    await this.channel.assertQueue(QUEUE, { durable: true });
    // 3) Enlazar (bind) la cola al exchange: "quiero copia de todo"
    await this.channel.bindQueue(QUEUE, EXCHANGE, "");

    console.log(">>> audit suscrito al exchange, escuchando", QUEUE);

    // 4) Consumir: por cada mensaje, procesarlo
    this.channel.consume(QUEUE, async (msg: any) => {
      if (!msg) return;
      const contenido = JSON.parse(msg.content.toString());
      await this.procesar(contenido);
      this.channel.ack(msg);   // confirmar que se proceso (lo saca de la cola)
    });
  }

  // Aqui va la logica de negocio de audit: guardar el evento
  async procesar(mensaje: any) {
    const { tipoEvento, data } = mensaje;
    console.log(">>> audit RECIBIO:", tipoEvento, "-", data.numero);

    const evento = this.eventoRepo.create({
      tipoEvento: tipoEvento,
      servicioOrigen: "pos",
      agregadoId: data.ventaId,
      sucursalId: data.sucursalId,
      payload: JSON.stringify(data),
    });
    await this.eventoRepo.save(evento);
    console.log(">>> audit GUARDO el evento");
  }
}
