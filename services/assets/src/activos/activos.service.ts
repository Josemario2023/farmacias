import { Injectable, NotFoundException, ConflictException, BadRequestException } from "@nestjs/common";
import { InjectRepository, InjectDataSource } from "@nestjs/typeorm";
import { Repository, DataSource } from "typeorm";
import { CategoriaActivo } from "./categoria-activo.entity";
import { ActivoFijo } from "./activo-fijo.entity";
import { Depreciacion } from "./depreciacion.entity";
import { CreateCategoriaActivoDto, CreateActivoDto, CalcularDepreciacionDto } from "./activos.dto";

@Injectable()
export class ActivosService {
  constructor(
    @InjectRepository(CategoriaActivo) private readonly catRepo: Repository<CategoriaActivo>,
    @InjectRepository(ActivoFijo) private readonly activoRepo: Repository<ActivoFijo>,
    @InjectRepository(Depreciacion) private readonly depRepo: Repository<Depreciacion>,
    @InjectDataSource() private readonly dataSource: DataSource,
  ) {}

  //  CATEGORIAS 
  listarCategorias(): Promise<CategoriaActivo[]> {
    return this.catRepo.find({ order: { nombre: "ASC" } });
  }

  async crearCategoria(dto: CreateCategoriaActivoDto): Promise<CategoriaActivo> {
    const existe = await this.catRepo.findOne({ where: { nombre: dto.nombre } });
    if (existe) throw new ConflictException("Ya existe la categoria " + dto.nombre);

    // El metodo de saldo decreciente necesita la tasa anual
    if (dto.metodoDepreciacion === "SALDO_DECRECIENTE" && !dto.tasaAnual) {
      throw new BadRequestException("El metodo SALDO_DECRECIENTE requiere tasaAnual");
    }

    return this.catRepo.save(
      this.catRepo.create({
        nombre: dto.nombre,
        vidaUtilMeses: dto.vidaUtilMeses,
        metodoDepreciacion: dto.metodoDepreciacion,
        tasaAnual: dto.tasaAnual ?? null,
      }),
    );
  }

  //  ACTIVOS 
  listarActivos(sucursalId?: number, estado?: string): Promise<ActivoFijo[]> {
    const where: any = {};
    if (sucursalId) where.sucursalId = sucursalId;
    if (estado) where.estado = estado;
    return this.activoRepo.find({ where, order: { activoId: "DESC" } });
  }

  async verActivo(id: number): Promise<any> {
    const activo = await this.activoRepo.findOne({ where: { activoId: id } });
    if (!activo) throw new NotFoundException("Activo " + id + " no encontrado");

    // Traer su historial de depreciacion
    const depreciaciones = await this.depRepo.find({
      where: { activoId: id },
      order: { periodo: "ASC" },
    });

    // El valor actual es el del ultimo registro (o el de adquisicion si no hay)
    const ultima = depreciaciones[depreciaciones.length - 1];
    const valorActual = ultima ? Number(ultima.valorLibros) : Number(activo.valorAdquisicion);

    return { ...activo, valorActual, depreciaciones };
  }

  async crearActivo(dto: CreateActivoDto): Promise<ActivoFijo> {
    const categoria = await this.catRepo.findOne({
      where: { categoriaActivoId: dto.categoriaActivoId },
    });
    if (!categoria) {
      throw new BadRequestException("La categoria " + dto.categoriaActivoId + " no existe");
    }

    const existe = await this.activoRepo.findOne({ where: { codigo: dto.codigo } });
    if (existe) throw new ConflictException("Ya existe el activo " + dto.codigo);

    return this.activoRepo.save(
      this.activoRepo.create({
        codigo: dto.codigo,
        nombre: dto.nombre,
        categoriaActivoId: dto.categoriaActivoId,
        sucursalId: dto.sucursalId,
        valorAdquisicion: dto.valorAdquisicion,
        fechaAdquisicion: new Date(dto.fechaAdquisicion + "T12:00:00"),
        estado: "ACTIVO",
      }),
    );
  }

  // Dar de BAJA (no se borra: tiene historial de depreciacion)
  async darDeBaja(id: number): Promise<ActivoFijo> {
    const activo = await this.activoRepo.findOne({ where: { activoId: id } });
    if (!activo) throw new NotFoundException("Activo " + id + " no encontrado");
    if (activo.estado === "BAJA") {
      throw new BadRequestException("El activo ya esta dado de BAJA");
    }
    activo.estado = "BAJA";
    return this.activoRepo.save(activo);
  }

  
  // CALCULAR LA DEPRECIACION DE UN PERIODO
  // Recorre los activos ACTIVOS y registra su depreciacion mensual
  
  async calcularDepreciacion(dto: CalcularDepreciacionDto): Promise<any> {
    // 1) Traer los activos vigentes con los datos de su categoria
    let sql = `
      SELECT a.activo_id           AS "activoId",
             a.codigo              AS "codigo",
             a.nombre              AS "nombre",
             a.valor_adquisicion   AS "valorAdquisicion",
             a.sucursal_id         AS "sucursalId",
             c.vida_util_meses     AS "vidaUtilMeses",
             c.metodo_depreciacion AS "metodo",
             c.tasa_anual          AS "tasaAnual"
        FROM ACTIVO_FIJO a
        JOIN CATEGORIA_ACTIVO c ON c.categoria_activo_id = a.categoria_activo_id
       WHERE a.estado = 'ACTIVO'
    `;
    const params: any[] = [];
    if (dto.sucursalId) {
      sql += " AND a.sucursal_id = :1";
      params.push(dto.sucursalId);
    }

    const activos = await this.dataSource.query(sql, params);

    const resultados: any[] = [];
    let totalPeriodo = 0;

    for (const a of activos) {
      // 2) ¿Ya se calculo este periodo para este activo? (idempotencia)
      const yaExiste = await this.depRepo.findOne({
        where: { activoId: Number(a.activoId), periodo: dto.periodo },
      });
      if (yaExiste) continue;   // no recalcular

      // 3) Obtener la depreciacion acumulada hasta ahora
      const previa = await this.depRepo.findOne({
        where: { activoId: Number(a.activoId) },
        order: { periodo: "DESC" },
      });
      const acumuladaPrevia = previa ? Number(previa.depreciacionAcumulada) : 0;
      const valorLibrosPrevio = previa
        ? Number(previa.valorLibros)
        : Number(a.valorAdquisicion);

      // 4) Si ya se deprecio por completo, no hacer nada
      if (valorLibrosPrevio <= 0) continue;

      // 5) CALCULAR segun el metodo de la categoria
      let monto = 0;

      if (a.metodo === "LINEA_RECTA") {
        // Mismo monto cada mes: valor / vida util
        monto = Number(a.valorAdquisicion) / Number(a.vidaUtilMeses);
      } else {
        // SALDO_DECRECIENTE: un % del valor que le queda
        const tasaMensual = Number(a.tasaAnual ?? 0) / 100 / 12;
        monto = valorLibrosPrevio * tasaMensual;
      }

      // 6) Nunca depreciar mas de lo que queda
      if (monto > valorLibrosPrevio) monto = valorLibrosPrevio;
      monto = Math.round(monto * 100) / 100;   // 2 decimales

      const acumulada = acumuladaPrevia + monto;
      const valorLibros = Number(a.valorAdquisicion) - acumulada;

      // 7) Registrar
      const registro = await this.depRepo.save(
        this.depRepo.create({
          activoId: Number(a.activoId),
          periodo: dto.periodo,
          monto,
          depreciacionAcumulada: acumulada,
          valorLibros: valorLibros < 0 ? 0 : valorLibros,
        }),
      );

      totalPeriodo += monto;
      resultados.push({
        activo: a.codigo + " - " + a.nombre,
        metodo: a.metodo,
        monto,
        acumulada,
        valorLibros: registro.valorLibros,
      });
    }

    return {
      mensaje: "Depreciacion calculada",
      periodo: dto.periodo,
      activosProcesados: resultados.length,
      totalDepreciado: Math.round(totalPeriodo * 100) / 100,
      detalle: resultados,
    };
  }

  // CONSOLIDADO 
  // Valor de los activos por sucursal (para la auditoria)
  async valorPorSucursal(): Promise<any[]> {
    return this.dataSource.query(
      `SELECT a.sucursal_id             AS "sucursalId",
              COUNT(*)                  AS "cantidadActivos",
              SUM(a.valor_adquisicion)  AS "valorAdquisicion",
              SUM(NVL(d.valor_libros, a.valor_adquisicion)) AS "valorEnLibros"
         FROM ACTIVO_FIJO a
         LEFT JOIN (
              SELECT activo_id, valor_libros,
                     ROW_NUMBER() OVER (PARTITION BY activo_id ORDER BY periodo DESC) AS rn
                FROM DEPRECIACION
         ) d ON d.activo_id = a.activo_id AND d.rn = 1
        WHERE a.estado = 'ACTIVO'
        GROUP BY a.sucursal_id
        ORDER BY a.sucursal_id`,
    );
  }

  // Gasto de depreciacion de un periodo
  async gastoDepreciacion(periodo: string): Promise<any[]> {
    return this.dataSource.query(
      `SELECT a.sucursal_id    AS "sucursalId",
              SUM(d.monto)     AS "totalDepreciado",
              COUNT(*)         AS "activos"
         FROM DEPRECIACION d
         JOIN ACTIVO_FIJO a ON a.activo_id = d.activo_id
        WHERE d.periodo = :1
        GROUP BY a.sucursal_id
        ORDER BY a.sucursal_id`,
      [periodo],
    );
  }
}