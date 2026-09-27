import { Injectable, NotFoundException, ConflictException, BadRequestException } from "@nestjs/common";
import { InjectRepository, InjectDataSource } from "@nestjs/typeorm";
import { Repository, DataSource } from "typeorm";
import { OrdenCompra } from "./orden-compra.entity";
import { OrdenCompraDetalle } from "./orden-detalle.entity";
import { Proveedor } from "../proveedores/proveedor.entity";
import { CreateOrdenDto } from "./create-orden.dto";
import { RecibirOrdenDto } from "./recibir-orden.dto";

@Injectable()
export class ComprasService {
  constructor(
    @InjectRepository(OrdenCompra)
    private readonly ordenRepo: Repository<OrdenCompra>,
    @InjectRepository(OrdenCompraDetalle)
    private readonly detalleRepo: Repository<OrdenCompraDetalle>,
    @InjectRepository(Proveedor)
    private readonly proveedorRepo: Repository<Proveedor>,
    @InjectDataSource()
    private readonly dataSource: DataSource,
  ) {}

  findAll(): Promise<OrdenCompra[]> {
    return this.ordenRepo.find({ order: { ordenId: "DESC" } });
  }

  async findOne(id: number): Promise<any> {
    const orden = await this.ordenRepo.findOne({ where: { ordenId: id } });
    if (!orden) throw new NotFoundException("Orden " + id + " no encontrada");
    const lineas = await this.detalleRepo.find({ where: { ordenId: id } });
    return { ...orden, lineas };
  }

  // ---------- CREAR la orden (estado BORRADOR) ----------
  async create(dto: CreateOrdenDto): Promise<any> {
    const proveedor = await this.proveedorRepo.findOne({ where: { proveedorId: dto.proveedorId } });
    if (!proveedor) {
      throw new BadRequestException("El proveedor " + dto.proveedorId + " no existe");
    }

    const existe = await this.ordenRepo.findOne({ where: { numero: dto.numero } });
    if (existe) {
      throw new ConflictException("Ya existe la orden " + dto.numero);
    }

    // Calcular el total sumando las lineas
    const total = dto.lineas.reduce((acc, l) => acc + l.cantidad * l.costoUnitario, 0);

    const orden = this.ordenRepo.create({
      numero: dto.numero,
      proveedorId: dto.proveedorId,
      sucursalId: dto.sucursalId,
      estado: "BORRADOR",
      fecha: new Date(),
      total,
    });
    const guardada = await this.ordenRepo.save(orden);

    // Guardar las lineas
    for (const l of dto.lineas) {
      await this.detalleRepo.save(
        this.detalleRepo.create({
          ordenId: guardada.ordenId,
          productoId: l.productoId,
          cantidad: l.cantidad,
          costoUnitario: l.costoUnitario,
          totalLinea: l.cantidad * l.costoUnitario,
        }),
      );
    }

    return this.findOne(guardada.ordenId);
  }

  // ---------- AUTORIZAR ----------
  async autorizar(id: number): Promise<OrdenCompra> {
    const orden = await this.ordenRepo.findOne({ where: { ordenId: id } });
    if (!orden) throw new NotFoundException("Orden " + id + " no encontrada");

    if (orden.estado !== "BORRADOR") {
      throw new BadRequestException(
        "Solo se puede autorizar una orden en BORRADOR (esta en " + orden.estado + ")",
      );
    }

    orden.estado = "AUTORIZADA";
    return this.ordenRepo.save(orden);
  }


  // RECIBIR: entra al KARDEX como COMPRA. TODO O NADA.
  
  async recibir(id: number, dto: RecibirOrdenDto): Promise<any> {
    const orden = await this.ordenRepo.findOne({ where: { ordenId: id } });
    if (!orden) throw new NotFoundException("Orden " + id + " no encontrada");

    if (orden.estado !== "AUTORIZADA") {
      throw new BadRequestException(
        "Solo se puede recibir una orden AUTORIZADA (esta en " + orden.estado + ")",
      );
    }

    const runner = this.dataSource.createQueryRunner();
    await runner.connect();

    try {
      const movimientos: number[] = [];

      // Por cada linea recibida, registrar un movimiento de COMPRA en el kardex
      for (const linea of dto.lineas) {
        await runner.query(
          `DECLARE v_id NUMBER;
           BEGIN
             PRC_REGISTRAR_MOVIMIENTO(:1, :2, :3, 'COMPRA', :4, :5, :6, :7, v_id);
           END;`,
          [
            orden.sucursalId,
            linea.productoId,
            linea.loteId,
            linea.cantidad,
            dto.usuarioId,
            orden.numero,
            "Recepcion de orden de compra " + orden.numero,
          ],
        );
        movimientos.push(linea.productoId);
      }

      // Cambiar el estado de la orden
      await runner.query(
        "UPDATE ORDEN_COMPRA SET estado = 'RECIBIDA' WHERE orden_id = :1",
        [id],
      );

      // CONFIRMAR todo junto
      await runner.query("COMMIT");

      return {
        mensaje: "Orden recibida. Stock actualizado en el kardex.",
        ordenId: id,
        lineasProcesadas: dto.lineas.length,
      };
    } catch (error: any) {
      await runner.query("ROLLBACK");   // si UNA linea falla, NINGUNA entra
      throw new BadRequestException(this.limpiarError(error));
    } finally {
      await runner.release();
    }
  }

  // ---------- ANULAR ----------
  async anular(id: number): Promise<OrdenCompra> {
    const orden = await this.ordenRepo.findOne({ where: { ordenId: id } });
    if (!orden) throw new NotFoundException("Orden " + id + " no encontrada");

    if (orden.estado === "RECIBIDA") {
      throw new BadRequestException(
        "No se puede anular una orden ya recibida (el stock ya entro). Use un ajuste.",
      );
    }

    orden.estado = "ANULADA";
    return this.ordenRepo.save(orden);
  }

  private limpiarError(error: any): string {
    const msg = error?.message ?? "Error al recibir la orden";
    const match = msg.match(/ORA-\d+:\s*(.+?)(\n|ORA-|$)/);
    return match ? match[1].trim() : msg;
  }
}