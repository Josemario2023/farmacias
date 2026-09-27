import { Injectable, OnModuleInit, OnModuleDestroy } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { InjectDataSource } from "@nestjs/typeorm";
import { DataSource } from "typeorm";
import * as sql from "mssql";

@Injectable()
export class SyncService implements OnModuleInit, OnModuleDestroy {
  private pool: any;   // pool de conexiones a SQL Server

  constructor(
    private readonly config: ConfigService,
    @InjectDataSource() private readonly oracleDs: DataSource,   // conexion a Oracle
  ) {}

  // Al arrancar: abrir la conexion a SQL Server
  async onModuleInit() {
    this.pool = await sql.connect({
      server: this.config.get<string>("MSSQL_HOST") ?? "localhost",
      port: Number(this.config.get<string>("MSSQL_PORT") ?? 1433),
      database: this.config.get<string>("MSSQL_DB"),
      user: this.config.get<string>("MSSQL_USER"),
      password: this.config.get<string>("MSSQL_PASSWORD"),
      options: { trustServerCertificate: true, encrypt: false },
    });
    console.log(">>> audit conectado a SQL Server (AUDITDB)");
  }

  async onModuleDestroy() {
    await this.pool?.close();
  }

  // ============================================================
  // LA SINCRONIZACION: Oracle -> SQL Server
  // ============================================================
  async sincronizar(): Promise<any> {
    // ---- 1) Leer el watermark (hasta donde ya sincronizamos) ----
    const control = await this.oracleDs.query(
      "SELECT ultimo_id_sync FROM SYNC_CONTROL WHERE destino = 'SQLSERVER_AUDITDB'",
    );
    const watermark = control.length > 0 ? Number(control[0].ULTIMO_ID_SYNC) : 0;

    // ---- 2) Traer de Oracle SOLO lo nuevo (el delta) ----
    const filas = await this.oracleDs.query(
      `SELECT bitacora_id, origen_esquema, tabla, operacion, clave_pk,
              valores_anteriores, valores_nuevos, usuario,
              TO_CHAR(fecha_evento, 'YYYY-MM-DD HH24:MI:SS') AS fecha_evento
         FROM BITACORA_LOCAL
        WHERE bitacora_id > :1
        ORDER BY bitacora_id`,
      [watermark],
    );

    if (filas.length === 0) {
      return { mensaje: "No hay filas nuevas para sincronizar", watermark, enviadas: 0 };
    }

    // ---- 3) Insertar en SQL Server con MERGE (idempotente: no duplica) ----
    let enviadas = 0;
    let ultimoId = watermark;

    for (const f of filas) {
      const request = this.pool.request();
      request.input("origen_id", sql.BigInt, f.BITACORA_ID);
      request.input("origen_esquema", sql.VarChar(30), f.ORIGEN_ESQUEMA);
      request.input("tabla", sql.VarChar(60), f.TABLA);
      request.input("operacion", sql.VarChar(10), f.OPERACION);
      request.input("clave_pk", sql.VarChar(100), f.CLAVE_PK);
      request.input("valores_anteriores", sql.NVarChar(sql.MAX), f.VALORES_ANTERIORES);
      request.input("valores_nuevos", sql.NVarChar(sql.MAX), f.VALORES_NUEVOS);
      request.input("usuario", sql.VarChar(60), f.USUARIO);
      request.input("fecha_evento", sql.VarChar(30), f.FECHA_EVENTO);

      // MERGE: si ya existe esa fila (mismo origen), no hace nada; si no, la inserta.
      await request.query(`
        MERGE dbo.BITACORA AS destino
        USING (SELECT @origen_esquema AS origen_esquema,
                      @tabla AS tabla,
                      @clave_pk AS clave_pk,
                      CONVERT(DATETIME2, @fecha_evento) AS fecha_evento) AS origen
           ON destino.origen_esquema = origen.origen_esquema
          AND destino.tabla          = origen.tabla
          AND destino.clave_pk       = origen.clave_pk
          AND destino.fecha_evento   = origen.fecha_evento
        WHEN NOT MATCHED THEN
          INSERT (origen_esquema, tabla, operacion, clave_pk,
                  valores_anteriores, valores_nuevos, usuario, fecha_evento)
          VALUES (@origen_esquema, @tabla, @operacion, @clave_pk,
                  @valores_anteriores, @valores_nuevos, @usuario,
                  CONVERT(DATETIME2, @fecha_evento));
      `);

      enviadas++;
      ultimoId = Number(f.BITACORA_ID);
    }

    // ---- 4) Avanzar el watermark ----
    await this.oracleDs.query(
      "UPDATE SYNC_CONTROL SET ultimo_id_sync = :1, actualizado_en = SYSTIMESTAMP WHERE destino = 'SQLSERVER_AUDITDB'",
      [ultimoId],
    );

    return {
      mensaje: "Sincronizacion completada",
      watermarkAnterior: watermark,
      watermarkNuevo: ultimoId,
      enviadas,
    };
  }
}