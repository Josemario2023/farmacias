import { Injectable, NotFoundException, ConflictException, BadRequestException } from "@nestjs/common";
import { InjectRepository, InjectDataSource } from "@nestjs/typeorm";
import { Repository, DataSource } from "typeorm";
import { Empleado } from "../empleados/empleado.entity";
import { Planilla } from "./planilla.entity";
import { PagoPlanilla } from "./pago-planilla.entity";
import { CreateEmpleadoDto, CreatePlanillaDto, CreatePagoDto } from "./planillas.dto";

@Injectable()
export class PlanillasService {
  constructor(
    @InjectRepository(Empleado) private readonly empleadoRepo: Repository<Empleado>,
    @InjectRepository(Planilla) private readonly planillaRepo: Repository<Planilla>,
    @InjectRepository(PagoPlanilla) private readonly pagoRepo: Repository<PagoPlanilla>,
    @InjectDataSource() private readonly dataSource: DataSource,
  ) {}

  //  EMPLEADOS 
  listarEmpleados(sucursalId?: number): Promise<Empleado[]> {
    const where: any = {};
    if (sucursalId) where.sucursalId = sucursalId;
    return this.empleadoRepo.find({ where, order: { nombre: "ASC" } });
  }

  async verEmpleado(id: number): Promise<Empleado> {
    const emp = await this.empleadoRepo.findOne({ where: { empleadoId: id } });
    if (!emp) throw new NotFoundException("Empleado " + id + " no encontrado");
    return emp;
  }

  async crearEmpleado(dto: CreateEmpleadoDto): Promise<Empleado> {
    const existe = await this.empleadoRepo.findOne({ where: { codigo: dto.codigo } });
    if (existe) throw new ConflictException("Ya existe el empleado " + dto.codigo);

    return this.empleadoRepo.save(
      this.empleadoRepo.create({
        codigo: dto.codigo,
        nombre: dto.nombre,
        puesto: dto.puesto ?? null,
        sucursalId: dto.sucursalId,
        usuarioId: dto.usuarioId ?? null,
        activo: 1,
      }),
    );
  }

  async actualizarEmpleado(id: number, dto: any): Promise<Empleado> {
    const emp = await this.verEmpleado(id);
    Object.assign(emp, dto);
    return this.empleadoRepo.save(emp);
  }

  // Baja logica: el empleado tiene historial de pagos
  async desactivarEmpleado(id: number): Promise<Empleado> {
    const emp = await this.verEmpleado(id);
    emp.activo = 0;
    return this.empleadoRepo.save(emp);
  }

  //  PLANILLAS 
  listarPlanillas(sucursalId?: number): Promise<Planilla[]> {
    const where: any = {};
    if (sucursalId) where.sucursalId = sucursalId;
    return this.planillaRepo.find({ where, order: { planillaId: "DESC" } });
  }

  async verPlanilla(id: number): Promise<any> {
    const planilla = await this.planillaRepo.findOne({ where: { planillaId: id } });
    if (!planilla) throw new NotFoundException("Planilla " + id + " no encontrada");
    const pagos = await this.pagoRepo.find({ where: { planillaId: id } });
    return { ...planilla, pagos };
  }

  async crearPlanilla(dto: CreatePlanillaDto): Promise<Planilla> {
    const existe = await this.planillaRepo.findOne({
      where: { periodo: dto.periodo, sucursalId: dto.sucursalId },
    });
    if (existe) {
      throw new ConflictException(
        "Ya existe la planilla del periodo " + dto.periodo + " para esa sucursal",
      );
    }

    return this.planillaRepo.save(
      this.planillaRepo.create({
        periodo: dto.periodo,
        sucursalId: dto.sucursalId,
        totalPagado: 0,
        estado: "ABIERTA",
      }),
    );
  }

  // Cerrar la planilla: ya no acepta mas pagos
  async cerrarPlanilla(id: number): Promise<Planilla> {
    const planilla = await this.planillaRepo.findOne({ where: { planillaId: id } });
    if (!planilla) throw new NotFoundException("Planilla " + id + " no encontrada");
    if (planilla.estado === "CERRADA") {
      throw new BadRequestException("La planilla ya esta CERRADA");
    }
    planilla.estado = "CERRADA";
    return this.planillaRepo.save(planilla);
  }

  //  PAGOS 
  async registrarPago(dto: CreatePagoDto): Promise<any> {
    const planilla = await this.planillaRepo.findOne({ where: { planillaId: dto.planillaId } });
    if (!planilla) throw new BadRequestException("La planilla " + dto.planillaId + " no existe");
    if (planilla.estado !== "ABIERTA") {
      throw new BadRequestException("No se pueden registrar pagos en una planilla CERRADA");
    }

    const empleado = await this.empleadoRepo.findOne({ where: { empleadoId: dto.empleadoId } });
    if (!empleado) throw new BadRequestException("El empleado " + dto.empleadoId + " no existe");
     if (empleado.activo !== 1) {
      throw new BadRequestException("El empleado " + empleado.nombre + " está dado de baja");
    }
    if (empleado.sucursalId !== planilla.sucursalId) {
      throw new BadRequestException("El empleado no pertenece a la sucursal de esta planilla");
    }


    // Guardar el pago
    const pago = await this.pagoRepo.save(
      this.pagoRepo.create({
        planillaId: dto.planillaId,
        empleadoId: dto.empleadoId,
        fechaPago: new Date(),
        tipo: dto.tipo,
        montoPagado: dto.montoPagado,
      }),
    );

    // Recalcular el total de la planilla (suma de todos sus pagos)
    const suma = await this.pagoRepo
      .createQueryBuilder("p")
      .select("SUM(p.montoPagado)", "total")
      .where("p.planillaId = :id", { id: dto.planillaId })
      .getRawOne();

    planilla.totalPagado = Number(suma?.total ?? 0);
    await this.planillaRepo.save(planilla);

    return { pago, totalPlanilla: planilla.totalPagado };
  }

  // CONSOLIDADO (gasto de personal)
  // Lo que alimenta la auditoria central
  async gastoPorSucursal(periodo: string): Promise<any[]> {
    return this.dataSource.query(
      `SELECT sucursal_id        AS "sucursalId",
              SUM(total_pagado)  AS "totalPagado",
              COUNT(*)           AS "planillas"
         FROM PLANILLA
        WHERE periodo = :1
        GROUP BY sucursal_id
        ORDER BY SUM(total_pagado) DESC`,
      [periodo],
    );
  }

  // Detalle por tipo de pago (salario vs bonos)
  async gastoPorTipo(periodo: string): Promise<any[]> {
    return this.dataSource.query(
      `SELECT pp.tipo              AS "tipo",
              SUM(pp.monto_pagado) AS "total",
              COUNT(*)             AS "pagos"
         FROM PAGO_PLANILLA pp
         JOIN PLANILLA p ON p.planilla_id = pp.planilla_id
        WHERE p.periodo = :1
        GROUP BY pp.tipo
        ORDER BY SUM(pp.monto_pagado) DESC`,
      [periodo],
    );
  }
}