import { AsyncLocalStorage } from "async_hooks";
import { DataSource } from "typeorm";

// Guarda quién hace la petición mientras ésta dura
const almacen = new AsyncLocalStorage<string>();

// Middleware: lee la cabecera que manda el gateway (x-usuario-id)
export function actorMiddleware(req: any, _res: any, next: () => void) {
  const id = req.headers["x-usuario-id"];
  almacen.run(typeof id === "string" ? id : "", () => next());
}

// Antes de cada escritura en Oracle, marca en la conexión quién la hace.
// Los triggers de bitácora leen esa marca (CLIENT_IDENTIFIER).
export function instalarActor(ds: DataSource) {
  const crearOriginal = ds.createQueryRunner.bind(ds);

  (ds as any).createQueryRunner = (modo?: any) => {
    const qr: any = crearOriginal(modo);
    const consulta = qr.query.bind(qr);

    qr.query = async (sql: string, params?: any, estructurado?: boolean) => {
      // Las lecturas no necesitan marca
      if (!/^\s*(SELECT|WITH)\b/i.test(sql)) {
        const actor = almacen.getStore() ?? "";
        if (actor) {
          await consulta("BEGIN DBMS_SESSION.SET_IDENTIFIER(:1); END;", [actor]);
        } else {
          // Sin persona (evento automático): limpiar, para no heredar la marca anterior
          await consulta("BEGIN DBMS_SESSION.CLEAR_IDENTIFIER; END;");
        }
      }
      return consulta(sql, params, estructurado);
    };

    return qr;
  };
}