import { Injectable, NotFoundException, BadRequestException, ConflictException } from "@nestjs/common";
import { InjectRepository, InjectDataSource } from "@nestjs/typeorm";
import { Repository, DataSource } from "typeorm";
import * as oracledb from "oracledb";
import { CorteCaja } from "./corte-caja.entity";
import { Caja } from "./caja.entity";
import { MovimientoCaja } from "./movimiento-caja.entity";
import { CreateCajaDto, AbrirCorteDto, CreateMovimientoCajaDto, CerrarCorteDto } from "./cortes.dto";
import { PublisherService } from "../messaging/publisher.service";

@Injectable()
export class CortesService {
  constructor(
    @InjectRepository(CorteCaja) private readonly corteRepo: Repository<CorteCaja>,
    @InjectRepository(Caja) private readonly cajaRepo: Repository<Caja>,
    @InjectRepository(MovimientoCaja) private readonly movRepo: Repository<MovimientoCaja>,
    @InjectDataSource() private readonly dataSource: DataSource,
    private readonly publisher: PublisherService,
  ) {}

  // ---------------- CAJAS (CRUD ) ----------------
  listarCajas(): Promise<Caja[]> {
    return this.cajaRepo.find({ order: { cajaId: "ASC" } });
  }

  async crearCaja(dto: CreateCajaDto): Promise<Caja> {
    const caja = this.cajaRepo.create({ ...dto, activo: 1 });
    return this.cajaRepo.save(caja);
  }

  // ---------------- CORTES ----------------
  findAll(): Promise<CorteCaja[]> {
    return this.corteRepo.find({ order: { corteId: "DESC" } });
  }

  async findOne(id: number): Promise<any> {
    const corte = await this.corteRepo.findOne({ where: { corteId: id } });
    if (!corte) throw new NotFoundException("Corte " + id + " no encontrado");
    const movimientos = await this.movRepo.find({ where: { corteId: id }, order: { movimientoId: "ASC" } });
    return { ...corte, movimientos };
  }

  // Devuelve el corte ABIERTO de una caja (si lo hay)
  async corteAbierto(cajaId: number): Promise<CorteCaja | null> {
    return this.corteRepo.findOne({ where: { cajaId, estado: "ABIERTO" } });
  }

  // ---------------- 1) ABRIR el turno ----------------
  async abrir(dto: AbrirCorteDto): Promise<CorteCaja> {
    const caja = await this.cajaRepo.findOne({ where: { cajaId: dto.cajaId } });
    if (!caja) throw new BadRequestException("La caja " + dto.cajaId + " no existe");

    // No se puede abrir dos turnos a la vez en la misma caja
    const abierto = await this.corteAbierto(dto.cajaId);
    if (abierto) {
      throw new ConflictException(
        "La caja ya tiene el corte " + abierto.corteId + " ABIERTO. Cierrelo primero.",
      );
    }

    const corte = this.corteRepo.create({
      cajaId: dto.cajaId,
      sucursalId: dto.sucursalId,
      usuarioId: dto.usuarioId,
      turno: dto.turno,
      montoApertura: dto.montoApertura,
      totalSistema: 0,
      totalContado: null,
      diferencia: null,
      estado: "ABIERTO",
    });
    return this.corteRepo.save(corte);
  }

  // ---------------- 2) Registrar INGRESO / EGRESO ----------------
  async registrarMovimiento(dto: CreateMovimientoCajaDto): Promise<MovimientoCaja> {
    const corte = await this.corteRepo.findOne({ where: { corteId: dto.corteId } });
    if (!corte) throw new BadRequestException("El corte " + dto.corteId + " no existe");

    if (corte.estado !== "ABIERTO") {
      throw new BadRequestException("No se puede mover dinero en un corte CERRADO");
    }

    const movimiento = this.movRepo.create({
      corteId: dto.corteId,
      tipo: dto.tipo,
      concepto: dto.concepto,
      monto: dto.monto,
      refId: dto.refId ?? null,
      fecha: new Date(),
    });
    return this.movRepo.save(movimiento);
  }

  // ---------------- 3) CERRAR con conciliacion (PL/SQL) ----------------
  async cerrar(corteId: number, dto: CerrarCorteDto): Promise<any> {
    const runner = this.dataSource.createQueryRunner();
    await runner.connect();

    try {
      // Llamar al procedimiento (los OUT se ignoran; leemos de la tabla despues)
      await runner.query(
        `DECLARE
           v_sistema NUMBER;
           v_dif     NUMBER;
         BEGIN
           PRC_CERRAR_CORTE(:1, :2, :3, v_sistema, v_dif);
         END;`,
        [corteId, dto.totalContado, dto.usuarioId],
      );

      // Leer el corte YA ACTUALIZADO (la base tiene los valores correctos)
      const corte = await this.corteRepo.findOne({ where: { corteId } });
      if (!corte) throw new NotFoundException("Corte " + corteId + " no encontrado");

      const totalSistema = Number(corte.totalSistema);
      const diferencia = Number(corte.diferencia);

      let estado = "CUADRADO";
      if (diferencia < 0) estado = "FALTANTE";
      else if (diferencia > 0) estado = "SOBRANTE";

      // Publicar el evento para que audit detecte hallazgos automaticamente
      this.publisher.publish("CorteCerrado", {
        corteId,
        cajaId: corte.cajaId,
        sucursalId: corte.sucursalId,
        regionId: 1,
        usuarioId: dto.usuarioId,
        montoApertura: Number(corte.montoApertura),
        totalSistema,
        totalContado: Number(corte.totalContado),
        diferencia,
        estado,
      });

      return {
        mensaje: "Corte cerrado",
        corteId,
        montoApertura: Number(corte.montoApertura),
        totalSistema,
        totalContado: Number(corte.totalContado),
        diferencia,
        estado,
      };
    } catch (error: any) {
      throw new BadRequestException(this.limpiarError(error));
    } finally {
      await runner.release();
    }
  }

  private limpiarError(error: any): string {
    const msg = error?.message ?? "Error al cerrar el corte";
    const match = msg.match(/ORA-\d+:\s*(.+?)(\n|ORA-|$)/);
    return match ? match[1].trim() : msg;
  }
}