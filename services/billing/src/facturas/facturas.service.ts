import { Injectable, NotFoundException, BadRequestException, ConflictException } from "@nestjs/common";
import { InjectRepository, InjectDataSource } from "@nestjs/typeorm";
import { Repository, DataSource } from "typeorm";
import { Factura } from "./factura.entity";
import { FacturaDetalle } from "./factura-detalle.entity";
import { SerieFactura } from "./serie-factura.entity";
import { CreateSerieDto, EmitirFacturaDto } from "./facturas.dto";

// Tasa de impuesto (IVA Guatemala 12%)
const TASA_IMPUESTO = 0.12;

@Injectable()
export class FacturasService {
  constructor(
    @InjectRepository(Factura) private readonly facturaRepo: Repository<Factura>,
    @InjectRepository(FacturaDetalle) private readonly detalleRepo: Repository<FacturaDetalle>,
    @InjectRepository(SerieFactura) private readonly serieRepo: Repository<SerieFactura>,
    @InjectDataSource() private readonly dataSource: DataSource,
  ) {}

  // ---------------- SERIES ----------------
  listarSeries(): Promise<SerieFactura[]> {
    return this.serieRepo.find({ order: { serieId: "ASC" } });
  }

  async crearSerie(dto: CreateSerieDto): Promise<SerieFactura> {
    const existe = await this.serieRepo.findOne({
      where: { sucursalId: dto.sucursalId, serie: dto.serie },
    });
    if (existe) {
      throw new ConflictException("Ya existe la serie " + dto.serie + " en esa sucursal");
    }
    const serie = this.serieRepo.create({
      sucursalId: dto.sucursalId,
      serie: dto.serie,
      correlativoActual: 0,
      activo: 1,
    });
    return this.serieRepo.save(serie);
  }

  // Busca la serie activa de una sucursal (para facturar automaticamente)
  async serieDeSucursal(sucursalId: number): Promise<SerieFactura | null> {
    return this.serieRepo.findOne({ where: { sucursalId, activo: 1 } });
  }

  // ---------------- FACTURAS ----------------
  findAll(): Promise<Factura[]> {
    return this.facturaRepo.find({ order: { facturaId: "DESC" } });
  }

  async findOne(id: number): Promise<any> {
    const factura = await this.facturaRepo.findOne({ where: { facturaId: id } });
    if (!factura) throw new NotFoundException("Factura " + id + " no encontrada");
    const lineas = await this.detalleRepo.find({ where: { facturaId: id } });
    return { ...factura, lineas };
  }


  // EMITIR FACTURA 
    async emitir(dto: EmitirFacturaDto): Promise<any> {
    let subtotal = 0;
    let impuesto = 0;

    for (const l of dto.lineas) {
      const totalLinea = l.cantidad * l.precioUnitario;
      const impLinea = l.impuesto ?? totalLinea * TASA_IMPUESTO;
      subtotal += totalLinea;
      impuesto += impLinea;
    }
    const total = subtotal + impuesto;

    const runner = this.dataSource.createQueryRunner();
    await runner.connect();

    try {
      // Llamar al procedimiento SIN parametros OUT hacia Node:
      // los OUT caen en variables locales del bloque PL/SQL.
      await runner.query(
        `DECLARE
           v_factura_id NUMBER;
           v_numero     NUMBER;
         BEGIN
           PRC_EMITIR_FACTURA(:1, :2, :3, :4, :5, :6, :7, v_factura_id, v_numero);
         END;`,
        [
          dto.serieId,
          dto.ventaId ?? 0,
          dto.clienteId ?? 0,
          dto.sucursalId,
          subtotal,
          impuesto,
          total,
        ],
      );

      // Buscar la factura recien creada (la ultima de esa serie)
      const creada = await runner.query(
        `SELECT factura_id FROM FACTURA
          WHERE serie_id = :1
          ORDER BY numero DESC
          FETCH FIRST 1 ROWS ONLY`,
        [dto.serieId],
      );
      const facturaId = Number(creada[0].FACTURA_ID);

      // Insertar las lineas en la MISMA transaccion
      for (const l of dto.lineas) {
        const totalLinea = l.cantidad * l.precioUnitario;
        const impLinea = l.impuesto ?? totalLinea * TASA_IMPUESTO;
        await runner.query(
          `INSERT INTO FACTURA_DETALLE
             (factura_id, producto_id, descripcion, cantidad, precio_unitario, impuesto, total)
           VALUES (:1, :2, :3, :4, :5, :6, :7)`,
          [facturaId, l.productoId, l.descripcion, l.cantidad, l.precioUnitario, impLinea, totalLinea],
        );
      }

      await runner.query("COMMIT");

      return await this.findOne(facturaId);
    } catch (error: any) {
      await runner.query("ROLLBACK");
      throw new BadRequestException(this.limpiarError(error));
    } finally {
      await runner.release();
    }
  }
 

  // ---------------- ANULAR ----------------
  async anular(id: number): Promise<Factura> {
    const factura = await this.facturaRepo.findOne({ where: { facturaId: id } });
    if (!factura) throw new NotFoundException("Factura " + id + " no encontrada");
    if (factura.estado === "ANULADA") {
      throw new BadRequestException("La factura ya esta anulada");
    }
    // Las facturas NO se borran: se anulan (el correlativo queda usado)
    factura.estado = "ANULADA";
    return this.facturaRepo.save(factura);
  }

  private limpiarError(error: any): string {
    const msg = error?.message ?? "Error al emitir la factura";
    const match = msg.match(/ORA-\d+:\s*(.+?)(\n|ORA-|$)/);
    return match ? match[1].trim() : msg;
  }
}