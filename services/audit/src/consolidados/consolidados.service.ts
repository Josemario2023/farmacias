import { Injectable } from "@nestjs/common";
import { InjectRepository, InjectDataSource } from "@nestjs/typeorm";
import { Repository, DataSource } from "typeorm";
import { ConsolidadoVentas } from "./consolidado-ventas.entity";
import { Hallazgo } from "./hallazgo.entity";

@Injectable()
export class ConsolidadosService {
  constructor(
    @InjectRepository(ConsolidadoVentas)
    private readonly consVentasRepo: Repository<ConsolidadoVentas>,
    @InjectRepository(Hallazgo)
    private readonly hallazgoRepo: Repository<Hallazgo>,
    @InjectDataSource()
    private readonly dataSource: DataSource,
  ) {}

  
  // CONSOLIDAR VENTAS de un día, agrupando por región y sucursal
 
  async consolidarVentas(fecha: string): Promise<any> {
    // Agrupa los eventos SaleCreated de ese día
    const filas = await this.dataSource.query(
      `SELECT NVL(region_id, TO_NUMBER(JSON_VALUE(payload, '$.regionId'))) AS "regionId",
              sucursal_id                                                  AS "sucursalId",
              COUNT(*)                                                     AS "cantidad",
              SUM(TO_NUMBER(JSON_VALUE(payload, '$.total')))               AS "total"
         FROM EVENTO
        WHERE tipo_evento = 'SaleCreated'
          AND TRUNC(ocurrido_en) = TO_DATE(:1, 'YYYY-MM-DD')
        GROUP BY NVL(region_id, TO_NUMBER(JSON_VALUE(payload, '$.regionId'))), sucursal_id`,
      [fecha],
    );

    const resultados: any[] = [];

    for (const f of filas) {
      await this.consVentasRepo.delete({
        fecha: new Date(fecha + "T12:00:00"),
        sucursalId: Number(f.sucursalId),
      });

       const consolidado = this.consVentasRepo.create({
        fecha: new Date(fecha + "T12:00:00"),
        regionId: Number(f.regionId ?? 0),
        sucursalId: Number(f.sucursalId),
        totalVentas: Number(f.total ?? 0),
        cantidadVentas: Number(f.cantidad ?? 0),
      });
      resultados.push(await this.consVentasRepo.save(consolidado));
    }

    return {
      mensaje: "Consolidacion de ventas completada",
      fecha,
      sucursalesProcesadas: resultados.length,
      consolidados: resultados,
    };
  }

  // ---------- CONSULTAS PARA TABLEROS ----------

  // Ventas consolidadas por región (el tablero de la dirección)
  async ventasPorRegion(fechaInicio: string, fechaFin: string): Promise<any[]> {
    return this.dataSource.query(
        `SELECT region_id          AS "regionId",
              SUM(total_ventas)    AS "totalVentas",
              SUM(num_ventas)      AS "cantidadVentas",
              COUNT(DISTINCT sucursal_id) AS "sucursales"
         FROM CONSOLIDADO_VENTAS
        WHERE fecha BETWEEN TO_DATE(:1,'YYYY-MM-DD') AND TO_DATE(:2,'YYYY-MM-DD')
        GROUP BY region_id
        ORDER BY SUM(total_ventas) DESC`,
      [fechaInicio, fechaFin],
    );
  }

  // Detalle por sucursal dentro de una región
  async ventasPorSucursal(regionId: number, fechaInicio: string, fechaFin: string): Promise<any[]> {
    return this.dataSource.query(
        `SELECT sucursal_id         AS "sucursalId",
              SUM(total_ventas)    AS "totalVentas",
              SUM(num_ventas)      AS "cantidadVentas"
         FROM CONSOLIDADO_VENTAS
        WHERE region_id = :1
          AND fecha BETWEEN TO_DATE(:2,'YYYY-MM-DD') AND TO_DATE(:3,'YYYY-MM-DD')
        GROUP BY sucursal_id
        ORDER BY SUM(total_ventas) DESC`,
      [regionId, fechaInicio, fechaFin],
    );
  }

 
  // HALLAZGOS
  
    async crearHallazgo(datos: {
    tipo: string;
    severidad: string;
    descripcion: string;
    sucursalId: number;
    regionId: number;
    monto?: number;
  }): Promise<Hallazgo> {
    const hallazgo = this.hallazgoRepo.create({
      tipo: datos.tipo,
      severidad: datos.severidad,
      descripcion: datos.descripcion,
      sucursalId: datos.sucursalId,
      regionId: datos.regionId,
      monto: datos.monto ?? null,
      estado: "ABIERTO",
      creadoEn: new Date(),
    });
    return this.hallazgoRepo.save(hallazgo);
  }

  listarHallazgos(filtros: any): Promise<Hallazgo[]> {
    const where: any = {};
    if (filtros.estado) where.estado = filtros.estado;
    if (filtros.severidad) where.severidad = filtros.severidad;
    if (filtros.regionId) where.regionId = Number(filtros.regionId);
    if (filtros.tipo) where.tipo = filtros.tipo;
    return this.hallazgoRepo.find({ where, order: { hallazgoId: "DESC" } });
  }

  async cambiarEstado(id: number, estado: string): Promise<Hallazgo> {
    const hallazgo = await this.hallazgoRepo.findOne({ where: { hallazgoId: id } });
    if (!hallazgo) throw new Error("Hallazgo " + id + " no encontrado");
    hallazgo.estado = estado;
    return this.hallazgoRepo.save(hallazgo);
  }

  // Resumen para el panel: hallazgos abiertos por severidad
  async resumenHallazgos(): Promise<any[]> {
    return this.dataSource.query(
      `SELECT severidad AS "severidad", COUNT(*) AS "cantidad"
         FROM HALLAZGO
        WHERE estado = 'ABIERTO'
        GROUP BY severidad`,
    );
  }
}