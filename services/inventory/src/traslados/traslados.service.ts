import { Injectable, NotFoundException, ConflictException, BadRequestException } from "@nestjs/common";
import { InjectRepository, InjectDataSource } from "@nestjs/typeorm";
import { Repository, DataSource } from "typeorm";
import { Traslado } from "./traslado.entity";
import { TrasladoDetalle } from "./traslado-detalle.entity";
import { CreateTrasladoFormalDto } from "./create-traslado-formal.dto";
import { EnviarTrasladoDto, RecibirTrasladoDto } from "./mover-traslado.dto";

@Injectable()
export class TrasladosService {
  constructor(
    @InjectRepository(Traslado)
    private readonly trasladoRepo: Repository<Traslado>,
    @InjectRepository(TrasladoDetalle)
    private readonly detalleRepo: Repository<TrasladoDetalle>,
    @InjectDataSource()
    private readonly dataSource: DataSource,
  ) {}

  findAll(): Promise<Traslado[]> {
    return this.trasladoRepo.find({ order: { trasladoId: "DESC" } });
  }

  async findOne(id: number): Promise<any> {
    const traslado = await this.trasladoRepo.findOne({ where: { trasladoId: id } });
    if (!traslado) throw new NotFoundException("Traslado " + id + " no encontrado");
    const lineas = await this.detalleRepo.find({ where: { trasladoId: id } });
    return { ...traslado, lineas };
  }

  // ---------- 1) SOLICITAR (crea en estado SOLICITADO) ----------
  async solicitar(dto: CreateTrasladoFormalDto): Promise<any> {
    if (dto.sucursalOrigenId === dto.sucursalDestinoId) {
      throw new BadRequestException("El origen y el destino no pueden ser la misma sucursal");
    }

    const existe = await this.trasladoRepo.findOne({ where: { numero: dto.numero } });
    if (existe) throw new ConflictException("Ya existe el traslado " + dto.numero);

    const traslado = this.trasladoRepo.create({
      numero: dto.numero,
      sucursalOrigenId: dto.sucursalOrigenId,
      sucursalDestinoId: dto.sucursalDestinoId,
      estado: "SOLICITADO",
      solicitadoPor: dto.solicitadoPor,
      autorizadoPor: null,
      recibidoPor: null,
      fecha: new Date(),
    });
    const guardado = await this.trasladoRepo.save(traslado);

    for (const l of dto.lineas) {
      await this.detalleRepo.save(
        this.detalleRepo.create({
          trasladoId: guardado.trasladoId,
          productoId: l.productoId,
          loteId: l.loteId,
          cantSolicitada: l.cantSolicitada,
          cantEnviada: null,
          cantRecibida: null,
        }),
      );
    }

    return this.findOne(guardado.trasladoId);
  }

  // ---------- 2) AUTORIZAR ----------
  async autorizar(id: number, usuarioId: number): Promise<Traslado> {
    const traslado = await this.trasladoRepo.findOne({ where: { trasladoId: id } });
    if (!traslado) throw new NotFoundException("Traslado " + id + " no encontrado");

    if (traslado.estado !== "SOLICITADO") {
      throw new BadRequestException(
        "Solo se autoriza un traslado SOLICITADO (esta en " + traslado.estado + ")",
      );
    }

    traslado.estado = "AUTORIZADO";
    traslado.autorizadoPor = usuarioId;
    return this.trasladoRepo.save(traslado);
  }

  // ---------- 3) ENVIAR: SALE el stock del ORIGEN ----------
  async enviar(id: number, dto: EnviarTrasladoDto): Promise<any> {
    const traslado = await this.trasladoRepo.findOne({ where: { trasladoId: id } });
    if (!traslado) throw new NotFoundException("Traslado " + id + " no encontrado");

    if (traslado.estado !== "AUTORIZADO") {
      throw new BadRequestException(
        "Solo se envia un traslado AUTORIZADO (esta en " + traslado.estado + ")",
      );
    }

    const runner = this.dataSource.createQueryRunner();
    await runner.connect();

    try {
      for (const linea of dto.lineas) {
        const detalle = await this.detalleRepo.findOne({
          where: { trasladoDetalleId: linea.trasladoDetalleId, trasladoId: id },
        });
        if (!detalle) {
          throw new BadRequestException("Linea " + linea.trasladoDetalleId + " no pertenece al traslado");
        }
        if (linea.cantEnviada > detalle.cantSolicitada) {
          throw new BadRequestException("No se puede enviar mas de lo solicitado");
        }

        // SALIDA del origen (movimiento en el kardex)
        await runner.query(
          `DECLARE v_id NUMBER;
           BEGIN PRC_REGISTRAR_MOVIMIENTO(:1, :2, :3, 'TRASLADO_SALIDA', :4, :5, :6, :7, v_id); END;`,
          [
            traslado.sucursalOrigenId,
            detalle.productoId,
            detalle.loteId,
            linea.cantEnviada,
            dto.usuarioId,
            traslado.numero,
            "Envio a sucursal " + traslado.sucursalDestinoId,
          ],
        );

        // Registrar cuanto se envio
        await runner.query(
          "UPDATE TRASLADO_DETALLE SET cant_enviada = :1 WHERE traslado_detalle_id = :2",
          [linea.cantEnviada, linea.trasladoDetalleId],
        );
      }

      await runner.query("UPDATE TRASLADO SET estado = 'ENVIADO' WHERE traslado_id = :1", [id]);
      await runner.query("COMMIT");

      return { mensaje: "Traslado enviado. Stock descontado del origen.", trasladoId: id };
    } catch (error: any) {
      await runner.query("ROLLBACK");
      throw new BadRequestException(this.limpiarError(error));
    } finally {
      await runner.release();
    }
  }

  // ---------- 4) RECIBIR: ENTRA el stock al DESTINO ----------
  async recibir(id: number, dto: RecibirTrasladoDto): Promise<any> {
    const traslado = await this.trasladoRepo.findOne({ where: { trasladoId: id } });
    if (!traslado) throw new NotFoundException("Traslado " + id + " no encontrado");

    if (traslado.estado !== "ENVIADO") {
      throw new BadRequestException(
        "Solo se recibe un traslado ENVIADO (esta en " + traslado.estado + ")",
      );
    }

    const runner = this.dataSource.createQueryRunner();
    await runner.connect();

    try {
      const diferencias: any[] = [];

      for (const linea of dto.lineas) {
        const detalle = await this.detalleRepo.findOne({
          where: { trasladoDetalleId: linea.trasladoDetalleId, trasladoId: id },
        });
        if (!detalle) {
          throw new BadRequestException("Linea " + linea.trasladoDetalleId + " no pertenece al traslado");
        }

        // ENTRADA al destino (movimiento en el kardex)
        await runner.query(
          `DECLARE v_id NUMBER;
           BEGIN PRC_REGISTRAR_MOVIMIENTO(:1, :2, :3, 'TRASLADO_ENTRADA', :4, :5, :6, :7, v_id); END;`,
          [
            traslado.sucursalDestinoId,
            detalle.productoId,
            detalle.loteId,
            linea.cantRecibida,
            dto.usuarioId,
            traslado.numero,
            "Recepcion desde sucursal " + traslado.sucursalOrigenId,
          ],
        );

        await runner.query(
          "UPDATE TRASLADO_DETALLE SET cant_recibida = :1 WHERE traslado_detalle_id = :2",
          [linea.cantRecibida, linea.trasladoDetalleId],
        );

        // Detectar diferencia entre lo enviado y lo recibido (para auditoria)
        const enviada = Number(detalle.cantEnviada ?? 0);
        if (enviada !== linea.cantRecibida) {
          diferencias.push({
            productoId: detalle.productoId,
            enviada,
            recibida: linea.cantRecibida,
            diferencia: linea.cantRecibida - enviada,
          });
        }
      }

      await runner.query(
        "UPDATE TRASLADO SET estado = 'RECIBIDO', recibido_por = :1 WHERE traslado_id = :2",
        [dto.usuarioId, id],
      );
      await runner.query("COMMIT");

      return {
        mensaje: "Traslado recibido. Stock ingresado al destino.",
        trasladoId: id,
        diferencias: diferencias.length > 0 ? diferencias : "Sin diferencias",
      };
    } catch (error: any) {
      await runner.query("ROLLBACK");
      throw new BadRequestException(this.limpiarError(error));
    } finally {
      await runner.release();
    }
  }

  async anular(id: number): Promise<Traslado> {
    const traslado = await this.trasladoRepo.findOne({ where: { trasladoId: id } });
    if (!traslado) throw new NotFoundException("Traslado " + id + " no encontrado");

    if (traslado.estado === "ENVIADO" || traslado.estado === "RECIBIDO") {
      throw new BadRequestException(
        "No se puede anular un traslado ya enviado o recibido. Use un ajuste.",
      );
    }

    traslado.estado = "ANULADO";
    return this.trasladoRepo.save(traslado);
  }

  private limpiarError(error: any): string {
    const msg = error?.message ?? "Error en el traslado";
    const match = msg.match(/ORA-\d+:\s*(.+?)(\n|ORA-|$)/);
    return match ? match[1].trim() : msg;
  }
}