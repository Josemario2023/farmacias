import { Injectable, NotFoundException, BadRequestException } from "@nestjs/common";
import { InjectRepository, InjectDataSource } from "@nestjs/typeorm";
import { Repository, DataSource } from "typeorm";
import { Disponibilidad } from "../disponibilidad/disponibilidad.entity";
import { CoberturaSucursal } from "./cobertura.entity";
import { FormaPagoSucursal } from "./forma-pago.entity";
import { Cotizacion } from "./cotizacion.entity";

@Injectable()
export class CotizacionesService {
  constructor(
    @InjectRepository(Disponibilidad)
    private readonly dispRepo: Repository<Disponibilidad>,
    @InjectRepository(CoberturaSucursal)
    private readonly coberturaRepo: Repository<CoberturaSucursal>,
    @InjectRepository(FormaPagoSucursal)
    private readonly formaPagoRepo: Repository<FormaPagoSucursal>,
    @InjectRepository(Cotizacion)
    private readonly cotizacionRepo: Repository<Cotizacion>,
    @InjectDataSource()
    private readonly dataSource: DataSource,
  ) {}

  //  COBERTURA (CRUD) 
  listarCobertura(): Promise<CoberturaSucursal[]> {
    return this.coberturaRepo.find({ order: { sucursalId: "ASC" } });
  }

  crearCobertura(dto: any): Promise<CoberturaSucursal> {
    return this.coberturaRepo.save(this.coberturaRepo.create(dto) as any);
  }

  //  FORMAS DE PAGO (CRUD) 
  listarFormasPago(sucursalId?: number): Promise<FormaPagoSucursal[]> {
    const where: any = { activo: 1 };
    if (sucursalId) where.sucursalId = sucursalId;
    return this.formaPagoRepo.find({ where, order: { sucursalId: "ASC" } });
  }

  crearFormaPago(dto: any): Promise<FormaPagoSucursal> {
    return this.formaPagoRepo.save(
      this.formaPagoRepo.create({ ...dto, activo: 1 }) as any,
    );
  }

  //  DISPONIBILIDAD
  listarDisponibilidad(productoId?: number, sucursalId?: number): Promise<Disponibilidad[]> {
    const where: any = {};
    if (productoId) where.productoId = productoId;
    if (sucursalId) where.sucursalId = sucursalId;
    return this.dispRepo.find({ where, order: { sucursalId: "ASC" } });
  }

  // Buscar por nombre del producto (lo que hace el operador del call center)
  async buscarPorNombre(texto: string): Promise<any[]> {
    return this.dataSource.query(
      `SELECT d.producto_id          AS "productoId",
              d.nombre_producto      AS "nombreProducto",
              d.sucursal_id          AS "sucursalId",
              d.cantidad_disponible  AS "cantidad",
              d.precio               AS "precio"
         FROM DISPONIBILIDAD d
        WHERE UPPER(d.nombre_producto) LIKE UPPER(:1)
          AND d.cantidad_disponible > 0
        ORDER BY d.cantidad_disponible DESC`,
      ["%" + texto + "%"],
    );
  }

  // Actualizar el read model (lo llamara el consumidor de eventos)
  async actualizarDisponibilidad(datos: {
    sucursalId: number;
    productoId: number;
    nombreProducto?: string;
    cantidadDisponible: number;
    precio?: number;
  }): Promise<void> {
    const existe = await this.dispRepo.findOne({
      where: { sucursalId: datos.sucursalId, productoId: datos.productoId },
    });

    if (existe) {
      existe.cantidadDisponible = datos.cantidadDisponible;
      if (datos.precio !== undefined) existe.precio = datos.precio;
      if (datos.nombreProducto) existe.nombreProducto = datos.nombreProducto;
      existe.actualizadoEn = new Date();
      await this.dispRepo.save(existe);
    } else {
      await this.dispRepo.save(
        this.dispRepo.create({
          sucursalId: datos.sucursalId,
          productoId: datos.productoId,
          nombreProducto: datos.nombreProducto ?? null,
          cantidadDisponible: datos.cantidadDisponible,
          precio: datos.precio ?? 0,
          actualizadoEn: new Date(),
        }),
      );
    }
  }

  
  // COTIZAR: el corazón del call center
  // Busca qué sucursales tienen el producto y sugiere la mejor
 
  async cotizar(dto: {
    productoId: number;
    clienteRef?: string;
    cantidad?: number;
  }): Promise<any> {
    const cantidadPedida = dto.cantidad ?? 1;

    // 1) Buscar TODAS las sucursales con stock suficiente,
    //    cruzando con su cobertura (tiempo de entrega)
    const opciones = await this.dataSource.query(
      `SELECT d.sucursal_id           AS "sucursalId",
              d.nombre_producto       AS "nombreProducto",
              d.cantidad_disponible   AS "cantidadDisponible",
              d.precio                AS "precio",
              c.tiempo_estimado_min   AS "tiempoEstimadoMin",
              c.radio_km              AS "radioKm"
         FROM DISPONIBILIDAD d
         LEFT JOIN COBERTURA_SUCURSAL c ON c.sucursal_id = d.sucursal_id
        WHERE d.producto_id = :1
          AND d.cantidad_disponible >= :2
        ORDER BY NVL(c.tiempo_estimado_min, 9999) ASC, d.precio ASC`,
      [dto.productoId, cantidadPedida],
    );

    if (opciones.length === 0) {
      throw new NotFoundException(
        "No hay disponibilidad del producto " + dto.productoId +
        " (cantidad solicitada: " + cantidadPedida + ")",
      );
    }

    // 2) La MEJOR opción es la primera: menor tiempo de entrega, luego menor precio
    const mejor = opciones[0];

    // 3) Consultar las formas de pago de esa sucursal
    const formasPago = await this.formaPagoRepo.find({
      where: { sucursalId: Number(mejor.sucursalId), activo: 1 },
    });
    const formasTexto = formasPago.map((f) => f.formaPago).join(", ") || "EFECTIVO";

    // 4) Registrar la cotización
    const cotizacion = await this.cotizacionRepo.save(
      this.cotizacionRepo.create({
        clienteRef: dto.clienteRef ?? null,
        productoId: dto.productoId,
        sucursalAsignadaId: Number(mejor.sucursalId),
        precio: Number(mejor.precio),
        formaPago: formasTexto,
        tiempoEstimadoMin: mejor.tiempoEstimadoMin ? Number(mejor.tiempoEstimadoMin) : null,
        estado: "PENDIENTE",
        creadoEn: new Date(),
      }),
    );

    // 5) Devolver la respuesta que el operador le lee al cliente
    return {
      cotizacionId: cotizacion.cotizacionId,
      producto: mejor.nombreProducto,
      sucursalSugerida: Number(mejor.sucursalId),
      precioUnitario: Number(mejor.precio),
      cantidad: cantidadPedida,
      total: Number(mejor.precio) * cantidadPedida,
      tiempoEstimadoMin: mejor.tiempoEstimadoMin,
      formasPago: formasTexto,
      otrasOpciones: opciones.slice(1, 4),   // alternativas por si el cliente prefiere otra
    };
  }

  // ---------------- Consultar cotizaciones ----------------
  listarCotizaciones(estado?: string): Promise<Cotizacion[]> {
    const where: any = {};
    if (estado) where.estado = estado;
    return this.cotizacionRepo.find({ where, order: { cotizacionId: "DESC" } });
  }

  async cambiarEstadoCotizacion(id: number, estado: string): Promise<Cotizacion> {
    const cotizacion = await this.cotizacionRepo.findOne({ where: { cotizacionId: id } });
    if (!cotizacion) throw new NotFoundException("Cotizacion " + id + " no encontrada");
    cotizacion.estado = estado;
    return this.cotizacionRepo.save(cotizacion);
  }
}