import { Injectable, OnModuleInit } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import * as amqp from "amqplib";
import { Evento } from "../eventos/evento.entity";
import { ConsolidadosService } from "../consolidados/consolidados.service";

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
    private readonly consolidadosService: ConsolidadosService,
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
      try {
        const contenido = JSON.parse(msg.content.toString());
        await this.procesar(contenido);
      } catch (e) {
        console.error(">>> audit: error procesando evento", e);
      }
      this.channel.ack(msg);
    });
  }

  async procesar(mensaje: any) {
    const { tipoEvento, data } = mensaje;
    console.log(">>> audit RECIBIO:", tipoEvento);

    // 1) Guardar SIEMPRE el evento crudo
    const evento = this.eventoRepo.create({
      tipoEvento: tipoEvento,
      servicioOrigen: tipoEvento === "CorteCerrado" ? "cash" : "pos",
      agregadoId: data.ventaId ?? data.corteId ?? null,
      sucursalId: data.sucursalId,
      regionId: data.regionId ?? null,
      payload: JSON.stringify(data),
    });
    await this.eventoRepo.save(evento);
    console.log(">>> audit GUARDO el evento");

    // 2) DETECCION AUTOMATICA DE HALLAZGOS
    if (tipoEvento === "CorteCerrado") {
      await this.revisarCorte(data);
    }
  }

  // Detecta faltantes y sobrantes al cerrar un corte de caja
  private async revisarCorte(data: any) {
    const diferencia = Number(data.diferencia ?? 0);

    if (diferencia === 0) {
      console.log("    corte cuadrado: sin hallazgo");
      return;
    }

    const esFaltante = diferencia < 0;
    const monto = Math.abs(diferencia);

    // La severidad depende de la magnitud del descuadre
    let severidad = "BAJA";
    if (monto >= 500) severidad = "ALTA";
    else if (monto >= 100) severidad = "MEDIA";

    await this.consolidadosService.crearHallazgo({
      tipo: esFaltante ? "FALTANTE_CAJA" : "SOBRANTE_CAJA",
      severidad,
      descripcion:
        (esFaltante ? "Faltante" : "Sobrante") + " de " + monto +
        " en el corte " + data.corteId +
        ". Sistema: " + data.totalSistema + ", contado: " + data.totalContado,
      sucursalId: data.sucursalId,
      regionId: data.regionId ?? 1,
      monto,
    });

    console.log(
      "    HALLAZGO generado: " + (esFaltante ? "FALTANTE" : "SOBRANTE") +
      " de " + monto + " (severidad " + severidad + ")",
    );
  }
}
