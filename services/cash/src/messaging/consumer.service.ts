import { Injectable, OnModuleInit } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import * as amqp from "amqplib";
import { CorteCaja } from "../cortes/corte-caja.entity";
import { MovimientoCaja } from "../cortes/movimiento-caja.entity";

const EXCHANGE = "farmacias.events";
const QUEUE = "cash_queue";

@Injectable()
export class ConsumerService implements OnModuleInit {
  private connection: any;
  private channel: any;

  constructor(
    private readonly config: ConfigService,
    @InjectRepository(CorteCaja) private readonly corteRepo: Repository<CorteCaja>,
    @InjectRepository(MovimientoCaja) private readonly movRepo: Repository<MovimientoCaja>,
  ) {}

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
      try {
        const contenido = JSON.parse(msg.content.toString());
        await this.procesar(contenido);
      } catch (e) {
        console.error(">>> cash: error procesando evento", e);
      }
      this.channel.ack(msg);
    });
  }

  // ============================================================
  // Al recibir una venta: registrar el EFECTIVO en el corte abierto
  // ============================================================
  async procesar(mensaje: any) {
    const { tipoEvento, data } = mensaje;
    if (tipoEvento !== "SaleCreated") return;   // solo reacciona a ventas

    console.log(">>> cash RECIBIO venta:", data.numero);

    // 1) Sumar SOLO los pagos en EFECTIVO (tarjeta/transferencia no entran al cajon)
    const pagos = data.pagos ?? [];
    const efectivo = pagos
      .filter((p: any) => p.formaPago === "EFECTIVO")
      .reduce((acc: number, p: any) => acc + Number(p.monto), 0);

    if (efectivo <= 0) {
      console.log("    (venta sin efectivo: nada que registrar en caja)");
      return;
    }

    // 2) Buscar el corte ABIERTO de esa sucursal
    const corte = await this.corteRepo.findOne({
      where: { sucursalId: data.sucursalId, estado: "ABIERTO" },
      order: { corteId: "DESC" },
    });

    if (!corte) {
      console.warn(
        "    ALERTA: no hay corte ABIERTO en la sucursal " + data.sucursalId +
        ". El efectivo de la venta " + data.numero + " no se registro.",
      );
      return;
    }

    // 3) Registrar el ingreso
    await this.movRepo.save(
      this.movRepo.create({
        corteId: corte.corteId,
        tipo: "INGRESO",
        concepto: "Venta " + data.numero,
        monto: efectivo,
        refId: data.ventaId,
        fecha: new Date(),
      }),
    );

    console.log("    Registrado ingreso de " + efectivo + " en el corte " + corte.corteId);
  }
}