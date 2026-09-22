import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { Venta } from "./venta.entity";
import { PublisherService } from "../messaging/publisher.service";

@Injectable()
export class VentasService {
  constructor(
    @InjectRepository(Venta)
    private readonly ventaRepo: Repository<Venta>,
    private readonly publisher: PublisherService,   // nuestro publicador de eventos
  ) {}

  findAll(): Promise<Venta[]> {
    return this.ventaRepo.find();
  }

  async create(datos: any): Promise<any> {
    // 1) Guardar la venta
    const venta = this.ventaRepo.create({
      numero: datos.numero,
      sucursalId: datos.sucursalId,
      usuarioId: datos.usuarioId,
      total: datos.total,
      estado: "PAGADA",
    });
    const guardada = await this.ventaRepo.save(venta);

    // 2) Armar el evento
    const evento = {
      ventaId: guardada.ventaId,
      numero: guardada.numero,
      sucursalId: guardada.sucursalId,
      regionId: datos.regionId ?? 1,
      usuarioId: guardada.usuarioId,
      total: guardada.total,
      fecha: new Date().toISOString(),
      items: datos.items ?? [],
    };

    // 3) Publicar en el exchange fanout (llegara a TODOS los suscritos)
    this.publisher.publish("SaleCreated", evento);

    return { venta: guardada, eventoPublicado: evento };
  }
}
