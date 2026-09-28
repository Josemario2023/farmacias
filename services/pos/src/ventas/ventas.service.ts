import { Injectable, BadRequestException, ConflictException } from "@nestjs/common";
import { InjectRepository, InjectDataSource } from "@nestjs/typeorm";
import { Repository, DataSource } from "typeorm";
import { HttpService } from "@nestjs/axios";
import { ConfigService } from "@nestjs/config";
import { firstValueFrom } from "rxjs";
import { Venta } from "./venta.entity";
import { VentaDetalle } from "./venta-detalle.entity";
import { Pago } from "./pago.entity";
import { CreateVentaDto } from "./create-venta.dto";
import { PublisherService } from "../messaging/publisher.service";

@Injectable()
export class VentasService {
  constructor(
    @InjectRepository(Venta) private readonly ventaRepo: Repository<Venta>,
    @InjectRepository(VentaDetalle) private readonly detalleRepo: Repository<VentaDetalle>,
    @InjectRepository(Pago) private readonly pagoRepo: Repository<Pago>,
    @InjectDataSource() private readonly dataSource: DataSource,
    private readonly http: HttpService,
    private readonly config: ConfigService,
    private readonly publisher: PublisherService,
  ) {}

  findAll(): Promise<Venta[]> {
    return this.ventaRepo.find({ order: { ventaId: "DESC" } });
  }

  async findOne(id: number): Promise<any> {
    const venta = await this.ventaRepo.findOne({ where: { ventaId: id } });
    if (!venta) throw new BadRequestException("Venta " + id + " no encontrada");
    const lineas = await this.detalleRepo.find({ where: { ventaId: id } });
    const pagos = await this.pagoRepo.find({ where: { ventaId: id } });
    return { ...venta, lineas, pagos };
  }


  // crear una venta tomando en cuenta valida stock, descuenta, guarda y publica
 
  async crearVenta(dto: CreateVentaDto): Promise<any> {
    const inventoryUrl = this.config.get<string>("INVENTORY_URL") ?? "http://localhost:3002";

    // ---------- 1) Validaciones previas ----------
    const existe = await this.ventaRepo.findOne({ where: { numero: dto.numero } });
    if (existe) throw new ConflictException("Ya existe la venta " + dto.numero);

    const totalVenta = dto.lineas.reduce((acc, l) => acc + l.cantidad * l.precioUnitario, 0);
    const totalPagos = dto.pagos.reduce((acc, p) => acc + p.monto, 0);

    // Los pagos deben cubrir el total (con tolerancia de centavos)
    if (Math.abs(totalPagos - totalVenta) > 0.01) {
      throw new BadRequestException(
        "Los pagos (" + totalPagos + ") no cuadran con el total de la venta (" + totalVenta + ")",
      );
    }


    // Descontar stock
    const movimientosHechos: any[] = [];

    try {
      for (const linea of dto.lineas) {
        await firstValueFrom(
          this.http.post(inventoryUrl + "/movimientos", {
            sucursalId: dto.sucursalId,
            productoId: linea.productoId,
            loteId: linea.loteId,
            tipoMovimiento: "VENTA",
            cantidad: linea.cantidad,
            usuarioId: dto.usuarioId,
            documentoRef: dto.numero,
            observaciones: "Venta " + dto.numero,
          }),
        );
        // Guardamos lo hecho por si hay que compensar
        movimientosHechos.push(linea);
      }
    } catch (error: any) {
      // Si falla una linea, DEVOLVEMOS el stock de las anteriores (compensacion)
      await this.compensarStock(inventoryUrl, movimientosHechos, dto);
      const mensaje = error?.response?.data?.message ?? "No se pudo descontar el stock";
      throw new BadRequestException(mensaje);
    }

    // ---------- 3) Guardar la venta (transaccional) ----------
    const runner = this.dataSource.createQueryRunner();
    await runner.connect();
    await runner.startTransaction();

    try {
      const venta = await runner.manager.save(
        this.ventaRepo.create({
          numero: dto.numero,
          sucursalId: dto.sucursalId,
          usuarioId: dto.usuarioId,
          corteId: dto.corteId ?? null,
          clienteId: dto.clienteId ?? null,
          total: totalVenta,
          estado: "PAGADA",
        }),
      );

      for (const l of dto.lineas) {
        await runner.manager.save(
          this.detalleRepo.create({
            ventaId: venta.ventaId,
            productoId: l.productoId,
            loteId: l.loteId,
            descripcion: l.descripcion,
            cantidad: l.cantidad,
            precioUnitario: l.precioUnitario,
            total: l.cantidad * l.precioUnitario,
          }),
        );
      }

      for (const p of dto.pagos) {
        await runner.manager.save(
          this.pagoRepo.create({
            ventaId: venta.ventaId,
            formaPago: p.formaPago,
            monto: p.monto,
            referencia: p.referencia ?? null,
          }),
        );
      }

      await runner.commitTransaction();

      // ---------- 4) Publicar el evento (ASINCRONO) ----------
      this.publisher.publish("SaleCreated", {
        ventaId: venta.ventaId,
        numero: venta.numero,
        sucursalId: venta.sucursalId,
        regionId: dto.regionId ?? 1,
        usuarioId: venta.usuarioId,
        total: totalVenta,
        fecha: new Date().toISOString(),
        pagos: dto.pagos,
        items: dto.lineas.map((l) => ({
          productoId: l.productoId,
          loteId: l.loteId,
          cantidad: l.cantidad,
          precioUnitario: l.precioUnitario,
        })),
      });

      return await this.findOne(venta.ventaId);
    } catch (error: any) {
      await runner.rollbackTransaction();
      // La venta no se guardo -> devolver el stock descontado
      await this.compensarStock(inventoryUrl, dto.lineas, dto);
      throw new BadRequestException("Error al guardar la venta: " + error.message);
    } finally {
      await runner.release();
    }
  }

  
 
  // Devolver si hay un error en el stock

  private async compensarStock(inventoryUrl: string, lineas: any[], dto: CreateVentaDto) {
    for (const linea of lineas) {
      try {
        await firstValueFrom(
          this.http.post(inventoryUrl + "/movimientos", {
            sucursalId: dto.sucursalId,
            productoId: linea.productoId,
            loteId: linea.loteId,
            tipoMovimiento: "DEVOLUCION_CLIENTE",   // entrada que revierte la salida
            cantidad: linea.cantidad,
            usuarioId: dto.usuarioId,
            documentoRef: dto.numero,
            observaciones: "Compensacion: venta " + dto.numero + " no completada",
          }),
        );
      } catch {
        // Si la compensacion falla, se registra pero no rompe el flujo
        console.error("ALERTA: no se pudo compensar el stock de la venta " + dto.numero);
      }
    }
  }

  // ---------- ANULAR venta (devuelve el stock) ----------
  async anular(id: number, usuarioId: number): Promise<any> {
    const venta = await this.ventaRepo.findOne({ where: { ventaId: id } });
    if (!venta) throw new BadRequestException("Venta " + id + " no encontrada");
    if (venta.estado === "ANULADA") {
      throw new BadRequestException("La venta ya esta anulada");
    }

    const inventoryUrl = this.config.get<string>("INVENTORY_URL") ?? "http://localhost:3002";
    const lineas = await this.detalleRepo.find({ where: { ventaId: id } });

    // Devolver el stock de cada linea
    for (const l of lineas) {
      await firstValueFrom(
        this.http.post(inventoryUrl + "/movimientos", {
          sucursalId: venta.sucursalId,
          productoId: l.productoId,
          loteId: l.loteId,
          tipoMovimiento: "DEVOLUCION_CLIENTE",
          cantidad: l.cantidad,
          usuarioId: usuarioId,
          documentoRef: venta.numero,
          observaciones: "Anulacion de venta " + venta.numero,
        }),
      );
    }

    venta.estado = "ANULADA";
    await this.ventaRepo.save(venta);
    return { mensaje: "Venta anulada. Stock devuelto al inventario.", ventaId: id };
  }
}