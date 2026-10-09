import { actorMiddleware, instalarActor } from "./actor";

/**
 * PRUEBAS DE actor.ts  (identifica QUIEN hace cada cambio en la base)
 *
 * Idea del modulo:
 *   1. actorMiddleware guarda el header x-usuario-id mientras dura la peticion.
 *   2. instalarActor "envuelve" las consultas de TypeORM: antes de cada ESCRITURA
 *      marca en la conexion de Oracle quien es (DBMS_SESSION.SET_IDENTIFIER).
 *   3. Los triggers de bitacora leen esa marca (CLIENT_IDENTIFIER).
 *
 * Aqui no hay Oracle: un DataSource FALSO anota que SQL se ejecuta y en que orden.
 */

// DataSource falso. Cada query del "query runner" se anota en `ejecutado`.
function dataSourceFalso() {
  const ejecutado: { sql: string; params?: any }[] = [];
  const ds: any = {
    createQueryRunner: () => ({
      query: async (sql: string, params?: any) => {
        ejecutado.push({ sql, params });
        return "resultado:" + sql.slice(0, 12);
      },
    }),
  };
  return { ds, ejecutado };
}

// Ejecuta `trabajo` como si fuera dentro de una peticion HTTP con ese header
async function enPeticion(headers: Record<string, any>, trabajo: () => Promise<void>) {
  let promesa: Promise<void> = Promise.resolve();
  actorMiddleware({ headers }, {}, () => {
    promesa = trabajo(); // se inicia DENTRO del contexto de la peticion
  });
  await promesa;
}

describe("actor.ts", () => {
  it("antes de una ESCRITURA marca al usuario y despues ejecuta la sentencia", async () => {
    const { ds, ejecutado } = dataSourceFalso();
    instalarActor(ds);

    await enPeticion({ "x-usuario-id": "42" }, async () => {
      await ds.createQueryRunner().query("INSERT INTO PRODUCTO VALUES (1)");
    });

    expect(ejecutado).toHaveLength(2);
    expect(ejecutado[0].sql).toContain("DBMS_SESSION.SET_IDENTIFIER");
    expect(ejecutado[0].params).toEqual(["42"]);          // la marca lleva el id del usuario
    expect(ejecutado[1].sql).toBe("INSERT INTO PRODUCTO VALUES (1)"); // y luego la sentencia real
  });

  it("las LECTURAS (SELECT / WITH) no marcan nada", async () => {
    const { ds, ejecutado } = dataSourceFalso();
    instalarActor(ds);

    await enPeticion({ "x-usuario-id": "42" }, async () => {
      const qr = ds.createQueryRunner();
      await qr.query("SELECT * FROM PRODUCTO");
      await qr.query("  select 1 from dual");           // minusculas y espacios
      await qr.query("WITH t AS (SELECT 1 FROM dual) SELECT * FROM t");
    });

    expect(ejecutado).toHaveLength(3);                    // solo las 3 lecturas, sin SET_IDENTIFIER
    expect(ejecutado.some((e) => e.sql.includes("IDENTIFIER"))).toBe(false);
  });

  it("sin usuario (evento automatico) LIMPIA la marca para no heredar la anterior", async () => {
    const { ds, ejecutado } = dataSourceFalso();
    instalarActor(ds);

    // peticion sin cabecera x-usuario-id (por ejemplo, un consumidor de RabbitMQ)
    await enPeticion({}, async () => {
      await ds.createQueryRunner().query("UPDATE STOCK SET CANTIDAD = 1");
    });

    expect(ejecutado[0].sql).toContain("CLEAR_IDENTIFIER");
    expect(ejecutado[0].params).toBeUndefined();
    expect(ejecutado[1].sql).toBe("UPDATE STOCK SET CANTIDAD = 1");
  });

  it("fuera de toda peticion tambien limpia la marca", async () => {
    const { ds, ejecutado } = dataSourceFalso();
    instalarActor(ds);

    await ds.createQueryRunner().query("DELETE FROM LOTE"); // no hay contexto de peticion

    expect(ejecutado[0].sql).toContain("CLEAR_IDENTIFIER");
  });

  it("el resultado de la consulta original se devuelve intacto", async () => {
    const { ds } = dataSourceFalso();
    instalarActor(ds);

    let resultado: any;
    await enPeticion({ "x-usuario-id": "7" }, async () => {
      resultado = await ds.createQueryRunner().query("UPDATE T SET A = 1");
    });

    expect(resultado).toBe("resultado:UPDATE T SET");
  });

  it("dos peticiones simultaneas NO mezclan sus usuarios", async () => {
    const { ds, ejecutado } = dataSourceFalso();
    instalarActor(ds);

    // Se lanzan a la vez, con una pausa para que se intercalen
    const pausa = () => new Promise((r) => setTimeout(r, 5));
    await Promise.all([
      enPeticion({ "x-usuario-id": "1" }, async () => {
        await pausa();
        await ds.createQueryRunner().query("INSERT INTO A VALUES (1)");
      }),
      enPeticion({ "x-usuario-id": "2" }, async () => {
        await ds.createQueryRunner().query("INSERT INTO B VALUES (1)");
      }),
    ]);

    const marcas = ejecutado.filter((e) => e.sql.includes("SET_IDENTIFIER")).map((e) => e.params[0]);
    expect(marcas.sort()).toEqual(["1", "2"]); // cada peticion marco SU usuario
  });

  it("un header que no es texto se trata como 'sin usuario'", async () => {
    const { ds, ejecutado } = dataSourceFalso();
    instalarActor(ds);

    await enPeticion({ "x-usuario-id": ["1", "2"] }, async () => {
      await ds.createQueryRunner().query("UPDATE T SET A = 1");
    });

    expect(ejecutado[0].sql).toContain("CLEAR_IDENTIFIER");
  });
});
