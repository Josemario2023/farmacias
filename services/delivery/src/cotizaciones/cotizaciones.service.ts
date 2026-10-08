import { Injectable, NotFoundException, BadRequestException } from "@nestjs/common";
import { InjectRepository, InjectDataSource } from "@nestjs/typeorm";
import { Repository, DataSource } from "typeorm";
import { Disponibilidad } from "../disponibilidad/disponibilidad.entity";
import { CoberturaSucursal } from "./cobertura.entity";
import { FormaPagoSucursal } from "./forma-pago.entity";
import { Cotizacion } from "./cotizacion.entity";
import { CotizacionDetalle } from "./cotizacion-detalle.entity";

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
    @InjectRepository(CotizacionDetalle)
    private readonly detalleRepo: Repository<CotizacionDetalle>,
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

  //apartado donde se hace la cotización.
 async cotizar(dto: {
    items: { productoId: number; cantidad: number }[];
    clienteNombre?: string;
    clienteDireccion?: string;
    clienteTelefono?: string;
  }): Promise<any> {
    if (!dto.items || dto.items.length === 0) {
      throw new BadRequestException("Agrega al menos un producto");
    }
    if (!dto.clienteNombre?.trim()) {
      throw new BadRequestException("El nombre del cliente es obligatorio");
    }

    // 1) Juntar productos repetidos: producto -> cantidad total pedida
    const pedido = new Map<number, number>();
    for (const it of dto.items) {
      const id = Number(it.productoId);
      const cant = Number(it.cantidad);
      if (!id || !(cant >= 1)) {
        throw new BadRequestException("Producto o cantidad invalidos");
      }
      pedido.set(id, (pedido.get(id) ?? 0) + cant);
    }
    const ids = [...pedido.keys()];

    // 2) Traer el stock de esos productos en todas las sucursales (con su tiempo de entrega)
    const marcas = ids.map((_, i) => ":" + (i + 1)).join(",");
    const filas = await this.dataSource.query(
      `SELECT d.sucursal_id           AS "sucursalId",
              d.producto_id           AS "productoId",
              d.nombre_producto       AS "nombreProducto",
              d.cantidad_disponible   AS "cantidad",
              d.precio                AS "precio",
              c.tiempo_estimado_min   AS "tiempoEstimadoMin"
         FROM DISPONIBILIDAD d
         LEFT JOIN COBERTURA_SUCURSAL c ON c.sucursal_id = d.sucursal_id
        WHERE d.producto_id IN (${marcas})`,
      ids,
    );

    // 3) Agrupar por sucursal y quedarse con las que cubren TODO el pedido
    const porSucursal = new Map<number, any[]>();
    for (const f of filas) {
      const s = Number(f.sucursalId);
      if (!porSucursal.has(s)) porSucursal.set(s, []);
      porSucursal.get(s)!.push(f);
    }

    const candidatas: any[] = [];
    for (const [sucursalId, lista] of porSucursal) {
      const lineas: any[] = [];
      let completa = true;
      for (const [productoId, cantidad] of pedido) {
        const f = lista.find((x) => Number(x.productoId) === productoId);
        if (!f || Number(f.cantidad) < cantidad) { completa = false; break; }
        lineas.push({
          productoId,
          nombreProducto: f.nombreProducto,
          cantidad,
          precioUnitario: Number(f.precio),
          total: Math.round(Number(f.precio) * cantidad * 100) / 100,
        });
      }
      if (!completa) continue;
      const total = Math.round(lineas.reduce((s, l) => s + l.total, 0) * 100) / 100;
      candidatas.push({
        sucursalId,
        lineas,
        total,
        tiempoEstimadoMin: lista[0].tiempoEstimadoMin != null ? Number(lista[0].tiempoEstimadoMin) : null,
      });
    }

    if (candidatas.length === 0) {
      // Explicar que producto falta en TODAS las sucursales, si es el caso
      const sinStock: number[] = [];
      for (const [productoId, cantidad] of pedido) {
        const hay = filas.some(
          (f: any) => Number(f.productoId) === productoId && Number(f.cantidad) >= cantidad,
        );
        if (!hay) sinStock.push(productoId);
      }
      throw new NotFoundException(
        sinStock.length > 0
          ? "Sin disponibilidad suficiente de los productos: " + sinStock.join(", ")
          : "Ninguna sucursal tiene todos los productos juntos",
      );
    }

    // 4) La mejor: menor tiempo de entrega, luego menor total
    candidatas.sort(
      (a, b) =>
        (a.tiempoEstimadoMin ?? 9999) - (b.tiempoEstimadoMin ?? 9999) || a.total - b.total,
    );
    const mejor = candidatas[0];

    // 5) Formas de pago que acepta esa sucursal
    const formas = await this.formaPagoRepo.find({
      where: { sucursalId: mejor.sucursalId, activo: 1 },
    });
    const formasPago = formas.length > 0 ? formas.map((f) => f.formaPago) : ["EFECTIVO"];

    // 6) Guardar la cotizacion (PENDIENTE, sin forma de pago: se elige al confirmar)
    const cot = await this.cotizacionRepo.save(
      this.cotizacionRepo.create({
        clienteNombre: dto.clienteNombre.trim(),
        clienteDireccion: dto.clienteDireccion?.trim() || null,
        clienteTelefono: dto.clienteTelefono?.trim() || null,
        sucursalAsignadaId: mejor.sucursalId,
        total: mejor.total,
        tiempoEstimadoMin: mejor.tiempoEstimadoMin,
        estado: "PENDIENTE",
        creadoEn: new Date(),
      }),
    );

    await this.detalleRepo.save(
      mejor.lineas.map((l: any) =>
        this.detalleRepo.create({
          cotizacionId: cot.cotizacionId,
          productoId: l.productoId,
          nombreProducto: l.nombreProducto,
          cantidad: l.cantidad,
          precioUnitario: l.precioUnitario,
          total: l.total,
        }),
      ),
    );

    // 7) Respuesta para el operador
    return {
      cotizacionId: cot.cotizacionId,
      sucursalSugerida: mejor.sucursalId,
      lineas: mejor.lineas,
      total: mejor.total,
      tiempoEstimadoMin: mejor.tiempoEstimadoMin,
      formasPago,
      otrasOpciones: candidatas.slice(1, 4).map((c) => ({
        sucursalId: c.sucursalId,
        total: c.total,
        tiempoEstimadoMin: c.tiempoEstimadoMin,
      })),
    };
  }
  
  
   

  //  Consultar cotizaciones 
  listarCotizaciones(estado?: string): Promise<Cotizacion[]> {
    const where: any = {};
    if (estado) where.estado = estado;
    return this.cotizacionRepo.find({ where, order: { cotizacionId: "DESC" } });
  }

   async verCotizacion(id: number): Promise<any> {
    const cot = await this.cotizacionRepo.findOne({ where: { cotizacionId: id } });
    if (!cot) throw new NotFoundException("Cotizacion " + id + " no encontrada");
    const lineas = await this.detalleRepo.find({
      where: { cotizacionId: id },
      order: { detalleId: "ASC" },
    });
    return { ...cot, lineas };
  }

  //apartado para cambiar la cotización.
  async cambiarEstadoCotizacion(id: number, estado: string, formaPago?: string): Promise<Cotizacion> {
    if (estado !== "CONFIRMADA" && estado !== "CANCELADA") {
      throw new BadRequestException("El estado debe ser CONFIRMADA o CANCELADA");
    }
    const cotizacion = await this.cotizacionRepo.findOne({ where: { cotizacionId: id } });
    if (!cotizacion) throw new NotFoundException("Cotizacion " + id + " no encontrada");
    if (cotizacion.estado !== "PENDIENTE") {
      throw new BadRequestException("Solo se puede cambiar una cotizacion PENDIENTE");
    }

    // Las cotizaciones nuevas (varios productos) se confirman con la forma de pago elegida
    if (estado === "CONFIRMADA" && cotizacion.productoId == null) {
      if (!formaPago) throw new BadRequestException("Elige la forma de pago");
      const formas = await this.formaPagoRepo.find({
        where: { sucursalId: cotizacion.sucursalAsignadaId, activo: 1 },
      });
      const validas = formas.length > 0 ? formas.map((f) => f.formaPago) : ["EFECTIVO"];
      if (!validas.includes(formaPago)) {
        throw new BadRequestException(
          "La sucursal no acepta " + formaPago + ". Opciones: " + validas.join(", "),
        );
      }
      cotizacion.formaPago = formaPago;
    }

    cotizacion.estado = estado;
    return this.cotizacionRepo.save(cotizacion);
  }
}