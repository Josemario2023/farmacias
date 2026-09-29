import { Injectable, BadRequestException } from "@nestjs/common";
import { InjectRepository, InjectDataSource } from "@nestjs/typeorm";
import { Repository, DataSource, Between, MoreThanOrEqual, LessThanOrEqual, Like } from "typeorm";
import * as oracledb from "oracledb";
import { MovimientoInv } from "./movimiento.entity";
import { Existencia } from "./existencia.entity";
import { CreateMovimientoDto } from "./create-movimiento.dto";
import { CreateTrasladoDto } from "./create-traslado.dto";
import { CreateTomaFisicaDto } from "./create-toma-fisica.dto";
import { PublisherService } from "../messaging/publisher.services";

@Injectable()
export class KardexService {
  constructor(
    @InjectRepository(MovimientoInv)
    private readonly movRepo: Repository<MovimientoInv>,
    @InjectRepository(Existencia)
    private readonly existRepo: Repository<Existencia>,
    @InjectDataSource()
    private readonly dataSource: DataSource,
    private readonly publisher: PublisherService,
  ) {}

  ///REGISTRO DE LOS MOVIMIENTOS
  async registrarMovimiento(dto: CreateMovimientoDto): Promise<any> {
    const runner = this.dataSource.createQueryRunner();
    await runner.connect();
    try {
      // Llamada al procedimiento. El ultimo parametro es OUT (devuelve el id).
      const resultado = await runner.query(
        `BEGIN PRC_REGISTRAR_MOVIMIENTO(:1, :2, :3, :4, :5, :6, :7, :8, :9); END;`,
        [
          dto.sucursalId,
          dto.productoId,
          dto.loteId,
          dto.tipoMovimiento,
          dto.cantidad,
          dto.usuarioId,
          dto.documentoRef ?? null,
          dto.observaciones ?? null,
          { dir: oracledb.BIND_OUT, type: oracledb.NUMBER },   // parametro OUT
        ],
      );

            await runner.query("COMMIT");
      const movimientoId = resultado?.outBinds?.[0] ?? resultado?.[0];

      // Publicar el cambio de stock para que delivery actualice su read model
      await this.publicarCambioStock(dto.sucursalId, dto.productoId);

      return { mensaje: "Movimiento registrado", movimientoId };
    } catch (error: any) {
      await runner.query("ROLLBACK");
      // Traducir el error de Oracle a un mensaje legible
      throw new BadRequestException(this.limpiarError(error));
    } finally {
      await runner.release();
    }
  }

  
    ///TRASLADO DE PRODUCTOS.
  async trasladar(dto: CreateTrasladoDto): Promise<any> {
    const runner = this.dataSource.createQueryRunner();
    await runner.connect();
    try {
      const resultado = await runner.query(
        `BEGIN PRC_TRASLADAR_STOCK(:1, :2, :3, :4, :5, :6, :7, :8, :9, :10); END;`,
        [
          dto.sucursalOrigen,
          dto.sucursalDestino,
          dto.productoId,
          dto.loteId,
          dto.cantidad,
          dto.usuarioId,
          dto.documentoRef,
          dto.observaciones ?? null,
          { dir: oracledb.BIND_OUT, type: oracledb.NUMBER },   // mov salida
          { dir: oracledb.BIND_OUT, type: oracledb.NUMBER },   // mov entrada
        ],
      );
      // El procedimiento hace su propio COMMIT
      return {
        mensaje: "Traslado realizado",
        movimientoSalida: resultado?.outBinds?.[0],
        movimientoEntrada: resultado?.outBinds?.[1],
      };
    } catch (error: any) {
      throw new BadRequestException(this.limpiarError(error));
    } finally {
      await runner.release();
    }
  }

    ///TOMA FÍSICA O CONTEO FÍSICO
  async tomaFisica(dto: CreateTomaFisicaDto): Promise<any> {
    const runner = this.dataSource.createQueryRunner();
    await runner.connect();
    try {
      const resultado = await runner.query(
        `BEGIN PRC_TOMA_FISICA(:1, :2, :3, :4, :5, :6, :7, :8, :9); END;`,
        [
          dto.sucursalId,
          dto.productoId,
          dto.loteId,
          dto.cantidadContada,
          dto.usuarioId,
          dto.documentoRef,
          dto.observaciones ?? null,
          { dir: oracledb.BIND_OUT, type: oracledb.NUMBER },   // diferencia
          { dir: oracledb.BIND_OUT, type: oracledb.NUMBER },   // movimiento_id
        ],
      );
      const diferencia = resultado?.outBinds?.[0];
      const movimientoId = resultado?.outBinds?.[1];
      return {
        mensaje: diferencia === 0 ? "El conteo cuadro: sin ajuste" : "Ajuste registrado",
        diferencia,
        movimientoId,
      };
    } catch (error: any) {
      throw new BadRequestException(this.limpiarError(error));
    } finally {
      await runner.release();
    }
  }


    ///CONSULTA DE KARDEX
  async consultarKardex(filtros: any): Promise<MovimientoInv[]> {
    const qb = this.movRepo.createQueryBuilder("m");

    if (filtros.productoId) {
      qb.andWhere("m.productoId = :productoId", { productoId: Number(filtros.productoId) });
    }
    if (filtros.loteId) {
      qb.andWhere("m.loteId = :loteId", { loteId: Number(filtros.loteId) });
    }
    if (filtros.numeroLote) {
      qb.andWhere("m.numeroLote LIKE :numeroLote", { numeroLote: "%" + filtros.numeroLote + "%" });
    }
    if (filtros.tipoMovimiento) {
      qb.andWhere("m.tipoMovimiento = :tipo", { tipo: filtros.tipoMovimiento });
    }
    if (filtros.sucursalId) {
      qb.andWhere("m.sucursalId = :sucursalId", { sucursalId: Number(filtros.sucursalId) });
    }
    if (filtros.usuarioId) {
      qb.andWhere("m.usuarioId = :usuarioId", { usuarioId: Number(filtros.usuarioId) });
    }
    if (filtros.fechaInicio) {
      qb.andWhere("m.fechaHora >= :fechaInicio", { fechaInicio: new Date(filtros.fechaInicio) });
    }
    if (filtros.fechaFin) {
      const fin = new Date(filtros.fechaFin);
      fin.setHours(23, 59, 59, 999);   // incluir todo el dia final
      qb.andWhere("m.fechaHora <= :fechaFin", { fechaFin: fin });
    }

    return qb.orderBy("m.movimientoId", "DESC").getMany();
  }

  // Historial completo de un producto
  async kardexProducto(productoId: number): Promise<MovimientoInv[]> {
    return this.movRepo.find({
      where: { productoId },
      order: { movimientoId: "ASC" },   // orden cronologico para ver la evolucion
    });
  }

 
    ///EXISTENCIAS
  async existencias(sucursalId?: number, productoId?: number): Promise<Existencia[]> {
    const where: any = {};
    if (sucursalId) where.sucursalId = sucursalId;
    if (productoId) where.productoId = productoId;
    return this.existRepo.find({ where, order: { sucursalId: "ASC", productoId: "ASC" } });
  }

  private async publicarCambioStock(sucursalId: number, productoId: number) {
    try {
      const filas = await this.dataSource.query(
        `SELECT NVL(SUM(e.cantidad), 0) AS "total",
                p.nombre                AS "nombre",
                p.precio_base           AS "precio"
           FROM PRODUCTO p
           LEFT JOIN EXISTENCIA e
                  ON e.producto_id = p.producto_id
                 AND e.sucursal_id = :1
          WHERE p.producto_id = :2
          GROUP BY p.nombre, p.precio_base`,
        [sucursalId, productoId],
      );

      if (filas.length === 0) return;

      this.publisher.publish("StockChanged", {
        sucursalId,
        productoId,
        nombreProducto: filas[0].nombre,
        cantidadDisponible: Number(filas[0].total),
        precio: Number(filas[0].precio),
      });
    } catch (e) {
      // Si falla la publicacion, NO rompemos el movimiento (ya se guardo bien)
      console.error(">>> inventory: no se pudo publicar StockChanged", e);
    }
  }

  // Limpia el error de Oracle para mostrar solo el mensaje util
  private limpiarError(error: any): string {
    const msg = error?.message ?? "Error al procesar el movimiento";
    // Los errores propios vienen como "ORA-20004: Stock insuficiente..."
    const match = msg.match(/ORA-\d+:\s*(.+?)(\n|ORA-|$)/);
    return match ? match[1].trim() : msg;
  }
}