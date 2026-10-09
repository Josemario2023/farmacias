import { Injectable } from "@nestjs/common";
import { InjectRepository, InjectDataSource } from "@nestjs/typeorm";
import { Repository, DataSource } from "typeorm";
import { ConsolidadoVentas } from "./consolidado-ventas.entity";
import { Hallazgo } from "./hallazgo.entity";
import { ConsolidadoCaja } from "./consolidado-caja.entity";
import { ConsolidadoInventario } from "./consolidado-inventario.entity";

@Injectable()
export class ConsolidadosService {
  constructor(
    @InjectRepository(ConsolidadoVentas)
    private readonly consVentasRepo: Repository<ConsolidadoVentas>,
    @InjectRepository(Hallazgo)
    private readonly hallazgoRepo: Repository<Hallazgo>,
    @InjectRepository(ConsolidadoCaja)
    private readonly consCajaRepo: Repository<ConsolidadoCaja>,
    @InjectRepository(ConsolidadoInventario)
    private readonly consInvRepo: Repository<ConsolidadoInventario>,
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
      await this.dataSource.query(
        `DELETE FROM CONSOLIDADO_VENTAS
          WHERE TRUNC(fecha) = TO_DATE(:1, 'YYYY-MM-DD') AND sucursal_id = :2`,
        [fecha, Number(f.sucursalId)],
      );

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

  // CONSOLIDAR CAJA
  async consolidarCaja(fecha: string): Promise<any> {
    const filas = await this.dataSource.query(
      `SELECT NVL(region_id, 1)  AS "regionId",
              sucursal_id        AS "sucursalId",
              SUM(TO_NUMBER(JSON_VALUE(payload, '$.totalSistema')))  AS "sistema",
              SUM(TO_NUMBER(JSON_VALUE(payload, '$.totalContado')))  AS "contado",
              SUM(TO_NUMBER(JSON_VALUE(payload, '$.diferencia')))    AS "diferencia",
              COUNT(*)           AS "cortes"
         FROM EVENTO
        WHERE tipo_evento = 'CorteCerrado'
          AND TRUNC(ocurrido_en) = TO_DATE(:1, 'YYYY-MM-DD')
        GROUP BY NVL(region_id, 1), sucursal_id`,
      [fecha],
    );

    const resultados: any[] = [];

    for (const f of filas) {
      // Recalcular: borrar el previo del día
      await this.dataSource.query(
        `DELETE FROM CONSOLIDADO_CAJA
          WHERE TRUNC(fecha) = TO_DATE(:1, 'YYYY-MM-DD') AND sucursal_id = :2`,
        [fecha, Number(f.sucursalId)],
      );

      const consolidado = this.consCajaRepo.create({
        fecha: new Date(fecha + "T12:00:00"),
        regionId: Number(f.regionId),
        sucursalId: Number(f.sucursalId),
        // El "ingreso" del día es lo que el sistema esperaba tener
        totalIngresos: Number(f.sistema ?? 0),
        totalEgresos: 0,
        diferencia: Number(f.diferencia ?? 0),
      });
      resultados.push(await this.consCajaRepo.save(consolidado));
    }

    return {
      mensaje: "Consolidacion de caja completada",
      fecha,
      sucursalesProcesadas: resultados.length,
      consolidados: resultados,
    };
  }

  // CONSOLIDAR INVENTARIO
  async consolidarInventario(fecha: string, datos: {
    sucursalId: number;
    regionId: number;
    valorInventario: number;
    productosBajoMinimo: number;
  }): Promise<ConsolidadoInventario> {
     await this.dataSource.query(
      `DELETE FROM CONSOLIDADO_INVENTARIO
        WHERE TRUNC(fecha) = TO_DATE(:1, 'YYYY-MM-DD') AND sucursal_id = :2`,
      [fecha, datos.sucursalId],
    );

    return this.consInvRepo.save(
      this.consInvRepo.create({
        fecha: new Date(fecha + "T12:00:00"),
        sucursalId: datos.sucursalId,
        regionId: datos.regionId,
        valorInventario: datos.valorInventario,
        productosBajoMinimo: datos.productosBajoMinimo,
      }),
    );
  }

  // BITACORA: el registro de todos los cambios del sistema
  async consultarBitacora(filtros: any): Promise<any[]> {
    let sql = `
      SELECT bitacora_id        AS "bitacoraId",
             origen_esquema     AS "esquema",
             tabla              AS "tabla",
             operacion          AS "operacion",
             clave_pk           AS "clavePk",
             valores_anteriores AS "valoresAnteriores",
             valores_nuevos     AS "valoresNuevos",
             usuario_app        AS "usuarioApp",
             TO_CHAR(fecha_evento, 'YYYY-MM-DD"T"HH24:MI:SS') AS "fechaEvento"
        FROM BITACORA_LOCAL
       WHERE 1 = 1
    `;
    const params: any[] = [];
    let i = 1;

    if (filtros.esquema) {
      sql += ` AND origen_esquema = :${i++}`;
      params.push(filtros.esquema);
    }
    if (filtros.tabla) {
      sql += ` AND tabla = :${i++}`;
      params.push(filtros.tabla);
    }
    if (filtros.operacion) {
      sql += ` AND operacion = :${i++}`;
      params.push(filtros.operacion);
    }
    if (filtros.fechaInicio) {
      sql += ` AND fecha_evento >= TO_DATE(:${i++}, 'YYYY-MM-DD')`;
      params.push(filtros.fechaInicio);
    }
    if (filtros.fechaFin) {
      sql += ` AND fecha_evento < TO_DATE(:${i++}, 'YYYY-MM-DD') + 1`;
      params.push(filtros.fechaFin);
    }

    sql += " ORDER BY bitacora_id DESC FETCH FIRST 300 ROWS ONLY";

    return this.dataSource.query(sql, params);
  }

  // Resumen: cuantos cambios por tabla
  async resumenBitacora(): Promise<any[]> {
    return this.dataSource.query(
      `SELECT origen_esquema AS "esquema",
              tabla          AS "tabla",
              operacion      AS "operacion",
              COUNT(*)       AS "cantidad"
         FROM BITACORA_LOCAL
        GROUP BY origen_esquema, tabla, operacion
        ORDER BY COUNT(*) DESC`,
    );
  }

  // CONSULTAS PARA TABLEROS

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

  // Ventas consolidadas SIN agrupar: una fila por día, región y sucursal.
  // La pantalla las agrupa por mes, región o sucursal como prefiera el usuario.
  async ventasDetalle(desde: string, hasta: string): Promise<any[]> {
    return this.dataSource.query(
      `SELECT TO_CHAR(fecha, 'YYYY-MM-DD') AS "fecha",
              region_id                    AS "regionId",
              sucursal_id                  AS "sucursalId",
              total_ventas                 AS "totalVentas",
              num_ventas                   AS "cantidadVentas"
         FROM CONSOLIDADO_VENTAS
        WHERE fecha BETWEEN TO_DATE(:1,'YYYY-MM-DD') AND TO_DATE(:2,'YYYY-MM-DD')
        ORDER BY fecha, sucursal_id`,
      [desde, hasta],
    );
  }

  // Caja consolidada SIN agrupar: una fila por día, región y sucursal
  async cajaDetalle(desde: string, hasta: string): Promise<any[]> {
    return this.dataSource.query(
      `SELECT TO_CHAR(fecha, 'YYYY-MM-DD') AS "fecha",
              region_id                    AS "regionId",
              sucursal_id                  AS "sucursalId",
              total_ingresos               AS "totalIngresos",
              total_egresos                AS "totalEgresos",
              diferencia                   AS "diferencia"
         FROM CONSOLIDADO_CAJA
        WHERE fecha BETWEEN TO_DATE(:1,'YYYY-MM-DD') AND TO_DATE(:2,'YYYY-MM-DD')
        ORDER BY fecha, sucursal_id`,
      [desde, hasta],
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

  // Caja por región:
  async cajaPorRegion(desde: string, hasta: string): Promise<any[]> {
    return this.dataSource.query(
      `SELECT region_id          AS "regionId",
              SUM(total_ingresos) AS "totalIngresos",
              SUM(diferencia)     AS "diferenciaAcumulada",
              COUNT(DISTINCT sucursal_id) AS "sucursales"
         FROM CONSOLIDADO_CAJA
        WHERE fecha BETWEEN TO_DATE(:1,'YYYY-MM-DD') AND TO_DATE(:2,'YYYY-MM-DD')
        GROUP BY region_id
        ORDER BY SUM(diferencia) ASC`,
      [desde, hasta],
    );
  }

  // Inventario por región
  async inventarioPorRegion(fecha: string): Promise<any[]> {
    return this.dataSource.query(
      `SELECT region_id                    AS "regionId",
              SUM(valor_inventario)        AS "valorInventario",
              SUM(productos_bajo_minimo)   AS "productosBajoMinimo",
              COUNT(DISTINCT sucursal_id)  AS "sucursales"
         FROM CONSOLIDADO_INVENTARIO
        WHERE fecha = TO_DATE(:1,'YYYY-MM-DD')
        GROUP BY region_id
        ORDER BY region_id`,
      [fecha],
    );
  }

  // Consolida TODOS los dias que tengan eventos de venta
  private enCurso: Promise<any> | null = null;

  consolidarTodo(): Promise<any> {
    if (!this.enCurso) {
      this.enCurso = this.consolidarTodoInterno().finally(() => {
        this.enCurso = null;
      });
    }
    return this.enCurso;
  }

  private async consolidarTodoInterno(): Promise<any> {
    const dias = await this.dataSource.query(
      `SELECT TO_CHAR(TRUNC(ocurrido_en), 'YYYY-MM-DD') AS "dia"
         FROM EVENTO
        WHERE tipo_evento = 'SaleCreated'
        GROUP BY TRUNC(ocurrido_en)
        ORDER BY 1`,
    );

    const procesados: string[] = [];
    for (const d of dias) {
      await this.consolidarVentas(d.dia);
      procesados.push(d.dia);
    }

    // También la caja: un día por cada cierre de corte
    const diasCaja = await this.dataSource.query(
      `SELECT TO_CHAR(TRUNC(ocurrido_en), 'YYYY-MM-DD') AS "dia"
         FROM EVENTO
        WHERE tipo_evento = 'CorteCerrado'
        GROUP BY TRUNC(ocurrido_en)
        ORDER BY 1`,
    );
    for (const d of diasCaja) {
      await this.consolidarCaja(d.dia);
    }

    return {
      mensaje: "Consolidacion completa",
      diasProcesados: procesados.length,
      dias: procesados,
      diasCaja: diasCaja.length,
    };
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