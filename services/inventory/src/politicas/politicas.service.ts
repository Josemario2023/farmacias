import { Injectable, NotFoundException, BadRequestException } from "@nestjs/common";
import { InjectRepository, InjectDataSource } from "@nestjs/typeorm";
import { Repository, DataSource } from "typeorm";
import { PoliticaStock } from "./politica-stock.entity";
import { Producto } from "../productos/producto.entity";
import { CreatePoliticaDto } from "./create-politica.dto";

@Injectable()
export class PoliticasService {
  constructor(
    @InjectRepository(PoliticaStock)
    private readonly politicaRepo: Repository<PoliticaStock>,
    @InjectRepository(Producto)
    private readonly productoRepo: Repository<Producto>,
    @InjectDataSource()
    private readonly dataSource: DataSource,
  ) {}

  findAll(): Promise<PoliticaStock[]> {
    return this.politicaRepo.find({ order: { sucursalId: "ASC", productoId: "ASC" } });
  }

  async findOne(id: number): Promise<PoliticaStock> {
    const politica = await this.politicaRepo.findOne({ where: { politicaId: id } });
    if (!politica) throw new NotFoundException("Politica " + id + " no encontrada");
    return politica;
  }

  // CREAR o ACTUALIZAR (si ya existe para esa sucursal/producto, la actualiza)
  async upsert(dto: CreatePoliticaDto): Promise<PoliticaStock> {
    const producto = await this.productoRepo.findOne({ where: { productoId: dto.productoId } });
    if (!producto) {
      throw new BadRequestException("El producto " + dto.productoId + " no existe");
    }

    const existe = await this.politicaRepo.findOne({
      where: { sucursalId: dto.sucursalId, productoId: dto.productoId },
    });

    if (existe) {
      existe.stockMinimo = dto.stockMinimo;
      return this.politicaRepo.save(existe);
    }

    const politica = this.politicaRepo.create(dto);
    return this.politicaRepo.save(politica);
  }

  async remove(id: number): Promise<{ mensaje: string }> {
    const politica = await this.findOne(id);
    await this.politicaRepo.remove(politica);
    return { mensaje: "Politica eliminada" };
  }

 
  // para las alertas con productos minimos.


  async alertasBajoMinimo(sucursalId?: number): Promise<any[]> {
    let sql = `
      SELECT ps.sucursal_id           AS "sucursalId",
             ps.producto_id           AS "productoId",
             p.codigo                 AS "codigo",
             p.nombre                 AS "nombre",
             ps.stock_minimo          AS "stockMinimo",
             NVL(SUM(e.cantidad), 0)  AS "stockActual",
             ps.stock_minimo - NVL(SUM(e.cantidad), 0) AS "faltante"
        FROM POLITICA_STOCK ps
        JOIN PRODUCTO p ON p.producto_id = ps.producto_id
        LEFT JOIN EXISTENCIA e
               ON e.producto_id = ps.producto_id
              AND e.sucursal_id = ps.sucursal_id
       WHERE p.activo = 1
    `;
    const params: any[] = [];

    if (sucursalId) {
      sql += " AND ps.sucursal_id = :1";
      params.push(sucursalId);
    }

    sql += `
       GROUP BY ps.sucursal_id, ps.producto_id, p.codigo, p.nombre, ps.stock_minimo
      HAVING NVL(SUM(e.cantidad), 0) <= ps.stock_minimo
       ORDER BY ps.sucursal_id, p.nombre
    `;

    return this.dataSource.query(sql, params);
  }

  

  //para las alertas o productos por vencer.
  async alertasPorVencer(dias: number = 60, sucursalId?: number): Promise<any[]> {
    let sql = `
      SELECT e.sucursal_id     AS "sucursalId",
             p.codigo          AS "codigo",
             p.nombre          AS "nombre",
             l.numero_lote     AS "numeroLote",
             TO_CHAR(l.fecha_vencimiento, 'YYYY-MM-DD') AS "fechaVencimiento",
             TRUNC(l.fecha_vencimiento - SYSDATE)       AS "diasRestantes",
             e.cantidad        AS "cantidad"
        FROM EXISTENCIA e
        JOIN LOTE l     ON l.lote_id     = e.lote_id
        JOIN PRODUCTO p ON p.producto_id = e.producto_id
       WHERE e.cantidad > 0
         AND l.fecha_vencimiento <= SYSDATE + :1
    `;
    const params: any[] = [dias];

    if (sucursalId) {
      sql += " AND e.sucursal_id = :2";
      params.push(sucursalId);
    }

    sql += " ORDER BY l.fecha_vencimiento ASC";

    return this.dataSource.query(sql, params);
  }
}