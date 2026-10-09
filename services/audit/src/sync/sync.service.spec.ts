import { SyncService } from "./sync.service";

/**
 * PRUEBAS UNITARIAS DE SyncService (Oracle -> SQL Server)
 *
 * No hay SQL Server ni Oracle: se simulan los dos. Lo mas valioso aqui es la
 * REGRESION de dos errores reales que ocurrieron al agregar usuario_app:
 *   "Must declare the scalar variable @usuario"
 *   "Must declare the scalar variable @valores_anteriores"
 * El MERGE usa variables @algo; cada una debe tener su request.input().
 */

// Pool falso de SQL Server: anota los inputs declarados y el SQL de cada consulta
function poolFalso() {
  const peticiones: { inputs: Record<string, any>; sql: string }[] = [];
  const pool = {
    request: () => {
      const actual = { inputs: {} as Record<string, any>, sql: "" };
      return {
        input: (nombre: string, _tipo: any, valor: any) => { actual.inputs[nombre] = valor; },
        query: async (sql: string) => { actual.sql = sql; peticiones.push(actual); },
      };
    },
  };
  return { pool, peticiones };
}

// Fila tal como la devuelve Oracle (nombres en MAYUSCULAS)
const fila = (id: number, extra: Partial<Record<string, any>> = {}) => ({
  BITACORA_ID: id,
  ORIGEN_ESQUEMA: "FRM_POS",
  TABLA: "VENTA",
  OPERACION: "INSERT",
  CLAVE_PK: String(id),
  VALORES_ANTERIORES: null,
  VALORES_NUEVOS: '{"total":10}',
  USUARIO: "FRM_POS",
  USUARIO_APP: "1",
  FECHA_EVENTO: "2026-10-08 12:00:00",
  ...extra,
});

describe("SyncService.sincronizar", () => {
  let oracle: { query: jest.Mock };
  let servicio: SyncService;
  let peticiones: ReturnType<typeof poolFalso>["peticiones"];

  // `filas` = lo que devuelve Oracle como pendiente; `watermark` = hasta donde ya se envio
  const montar = (watermark: number, filas: any[]) => {
    oracle = {
      query: jest.fn()
        .mockResolvedValueOnce([{ ULTIMO_ID_SYNC: watermark }]) // 1) leer control
        .mockResolvedValueOnce(filas)                            // 2) filas nuevas
        .mockResolvedValue(undefined),                           // 3) actualizar control
    };
    const { pool, peticiones: p } = poolFalso();
    peticiones = p;
    servicio = new SyncService({ get: jest.fn() } as any, oracle as any);
    (servicio as any).pool = pool; // se inyecta el pool falso (normalmente lo crea onModuleInit)
  };

  it("sin filas nuevas no envia nada ni mueve el watermark", async () => {
    montar(504, []);

    const r = await servicio.sincronizar();

    expect(r).toMatchObject({ enviadas: 0, watermark: 504 });
    expect(peticiones).toHaveLength(0);
    expect(oracle.query).toHaveBeenCalledTimes(2); // solo las 2 lecturas, ningun UPDATE
  });

  it("envia cada fila nueva y avanza el watermark al ULTIMO id", async () => {
    montar(10, [fila(11), fila(12), fila(13)]);

    const r = await servicio.sincronizar();

    expect(r).toMatchObject({ enviadas: 3, watermarkAnterior: 10, watermarkNuevo: 13 });
    expect(peticiones).toHaveLength(3);
    const update = oracle.query.mock.calls[2];
    expect(update[0]).toMatch(/UPDATE SYNC_CONTROL/);
    expect(update[1]).toEqual([13]);
  });

  it("pide a Oracle SOLO lo posterior al watermark (el delta)", async () => {
    montar(487, [fila(488)]);
    await servicio.sincronizar();
    const consulta = oracle.query.mock.calls[1];
    expect(consulta[0]).toMatch(/bitacora_id > :1/);
    expect(consulta[1]).toEqual([487]);
    expect(consulta[0]).toMatch(/usuario_app/); // y trae la columna de la persona
  });

  it("REGRESION: toda variable @algo del MERGE tiene su request.input()", async () => {
    montar(0, [fila(1)]);

    await servicio.sincronizar();

    const { inputs, sql } = peticiones[0];
    const usadas = Array.from(new Set((sql.match(/@[a-z_]+/g) ?? []).map((v) => v.slice(1))));

    expect(usadas.length).toBeGreaterThan(0);
    for (const nombre of usadas) {
      expect(Object.keys(inputs)).toContain(nombre); // si falta alguna, SQL Server falla en produccion
    }
    // y en particular estas dos, que fallaron
    expect(Object.keys(inputs)).toEqual(expect.arrayContaining(["usuario", "usuario_app", "valores_anteriores"]));
  });

  it("manda a SQL Server los valores correctos de la fila", async () => {
    montar(0, [fila(5, { USUARIO_APP: "42", OPERACION: "UPDATE", VALORES_ANTERIORES: '{"total":5}' })]);

    await servicio.sincronizar();

    expect(peticiones[0].inputs).toMatchObject({
      origen_esquema: "FRM_POS",
      tabla: "VENTA",
      operacion: "UPDATE",
      clave_pk: "5",
      usuario: "FRM_POS",
      usuario_app: "42",              // la persona que hizo el cambio
      valores_anteriores: '{"total":5}',
      valores_nuevos: '{"total":10}',
    });
  });

  it("el MERGE es idempotente: solo inserta si NO existe (no duplica)", async () => {
    montar(0, [fila(1)]);
    await servicio.sincronizar();
    expect(peticiones[0].sql).toMatch(/MERGE dbo\.BITACORA/);
    expect(peticiones[0].sql).toMatch(/WHEN NOT MATCHED THEN/);
    expect(peticiones[0].sql).toMatch(/usuario_app/);
  });

  it("si SQL Server falla, NO avanza el watermark (se reintenta despues)", async () => {
    montar(10, [fila(11), fila(12)]);
    (servicio as any).pool = {
      request: () => ({ input: () => {}, query: async () => { throw new Error("SQL Server caido"); } }),
    };

    await expect(servicio.sincronizar()).rejects.toThrow(/SQL Server caido/);

    // solo hubo las 2 lecturas: el UPDATE del watermark nunca se ejecuto
    expect(oracle.query).toHaveBeenCalledTimes(2);
  });

  it("sin fila de control empieza desde 0", async () => {
    oracle = { query: jest.fn().mockResolvedValueOnce([]).mockResolvedValueOnce([]) };
    servicio = new SyncService({ get: jest.fn() } as any, oracle as any);
    (servicio as any).pool = poolFalso().pool;

    const r = await servicio.sincronizar();

    expect(r.watermark).toBe(0);
  });
});
