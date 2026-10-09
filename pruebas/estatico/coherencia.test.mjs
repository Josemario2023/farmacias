/**
 * PRUEBAS DE COHERENCIA  (analisis estatico del codigo y de los scripts)
 *
 *     node --test pruebas/estatico/coherencia.test.mjs
 *
 * No necesitan servicios ni base de datos encendidos: LEEN los archivos del proyecto y
 * comprueban que las piezas encajen entre si. Atrapan los errores tipicos de un sistema
 * hecho de muchas partes:
 *   - una pantalla en el menu sin ruta (el clic mandaba al login)
 *   - una llamada a una API que el gateway no sabe enrutar
 *   - un permiso que el codigo exige pero que no existe en la base
 *   - un servicio al que se le olvido instalar el registro de "quien hizo el cambio"
 *   - una entidad de TypeORM sin su tabla en el script de base de datos
 */
import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync, existsSync, statSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { createHash } from "node:crypto";

const RAIZ = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
const leer = (...partes) => readFileSync(join(RAIZ, ...partes), "utf8");
const unicos = (lista) => [...new Set(lista)];

// Recorre una carpeta y devuelve los archivos que cumplan el filtro
function archivos(carpeta, filtro, acumulado = []) {
  for (const nombre of readdirSync(carpeta)) {
    if (nombre === "node_modules" || nombre === "dist") continue;
    const ruta = join(carpeta, nombre);
    if (statSync(ruta).isDirectory()) archivos(ruta, filtro, acumulado);
    else if (filtro(ruta)) acumulado.push(ruta);
  }
  return acumulado;
}

const SERVICIOS = ["users", "inventory", "pos", "billing", "cash", "assets", "payroll", "delivery"];

// ------------------------------------------------------------ datos base
const mapaRutas = leer("gateway", "src", "proxy", "rutas.map.ts");
const reglas = leer("gateway", "src", "auth", "reglas.map.ts");
const semillas = leer("infra", "db-init", "02-datos-iniciales.sql");
const esquema = leer("infra", "db-init", "01-esquema.sql");
const triggers = leer("infra", "db-init", "04-triggers-bitacora.sql");

const modulosEnrutados = unicos([...mapaRutas.matchAll(/^\s*"([a-z-]+)":\s*"[A-Z]+"/gm)].map((m) => m[1]));
// Permisos que dejan los scripts: los datos iniciales MAS las migraciones (infra/db-init/migraciones)
const migraciones = existsSync(join(RAIZ, "infra", "db-init", "migraciones"))
  ? readdirSync(join(RAIZ, "infra", "db-init", "migraciones")).filter((f) => f.endsWith(".sql"))
      .map((f) => readFileSync(join(RAIZ, "infra", "db-init", "migraciones", f), "utf8")).join("\n")
  : "";
const permisosEnBase = unicos([
  ...[...semillas.matchAll(/INSERT INTO FRM_USERS\.PERMISO \([^)]*\) VALUES \(\d+, '([A-Z_]+)'/g)].map((m) => m[1]),
  ...[...migraciones.matchAll(/INSERT INTO FRM_USERS\.PERMISO[^;]*?SELECT\s+'([A-Z_]+)'/g)].map((m) => m[1]),
]);

// ============================================================ FRONTEND
describe("frontend: menu, rutas y API", () => {
  test("TODA opcion del menu lateral tiene su ruta en App.tsx", () => {
    const menu = unicos([...leer("frontend", "src", "components", "layout", "Sidebar.tsx").matchAll(/ruta:\s*"(\/[a-z-]+)"/g)].map((m) => m[1]));
    const app = leer("frontend", "src", "App.tsx");
    const rutas = new Set([...app.matchAll(/path="(\/[a-z-]+)"/g)].map((m) => m[1]));
    assert.ok(menu.length >= 10, "no se leyo el menu");
    const sinRuta = menu.filter((r) => !rutas.has(r));
    assert.deepEqual(sinRuta, [], "Opciones del menu sin ruta (el clic mandaria al login): " + sinRuta.join(", "));
  });

  test("TODA llamada de la API del frontend es enrutable por el gateway", () => {
    const llamadas = [];
    for (const f of archivos(join(RAIZ, "frontend", "src", "api"), (r) => r.endsWith(".ts"))) {
      const texto = readFileSync(f, "utf8");
      for (const m of texto.matchAll(/api\.(?:get|post|patch|delete|put)(?:<[^>]*>)?\(\s*[`"]\/([a-z-]+)/g)) {
        llamadas.push({ modulo: m[1], archivo: f.split(/[\\/]/).pop() });
      }
    }
    assert.ok(llamadas.length > 50, "se esperaban muchas llamadas, se leyeron " + llamadas.length);
    const sinMapa = llamadas.filter((l) => !modulosEnrutados.includes(l.modulo));
    assert.deepEqual(sinMapa, [], "Llamadas a modulos que el gateway no enruta: " +
      unicos(sinMapa.map((l) => `/${l.modulo} (${l.archivo})`)).join(", "));
  });

  test("cada pagina enlazada en App.tsx existe como archivo", () => {
    const app = leer("frontend", "src", "App.tsx");
    for (const m of app.matchAll(/from "\.\/pages\/([A-Za-z]+)"/g)) {
      assert.ok(existsSync(join(RAIZ, "frontend", "src", "pages", m[1] + ".tsx")), `falta pages/${m[1]}.tsx`);
    }
  });
});

// ============================================================= GATEWAY
describe("gateway: reglas de permisos", () => {
  test("todo modulo con regla de permiso tiene ruta hacia un servicio", () => {
    const bloque = reglas.slice(reglas.indexOf("REGLAS_PERMISOS"), reglas.indexOf("REGLAS_ACCION"));
    const conRegla = unicos([...bloque.matchAll(/^\s*"?([a-z-]+)"?\s*:\s*\{/gm)].map((m) => m[1]));
    assert.ok(conRegla.length > 20);
    const huerfanos = conRegla.filter((m) => !modulosEnrutados.includes(m));
    assert.deepEqual(huerfanos, [], "Reglas de modulos que no se enrutan: " + huerfanos.join(", "));
  });

  test("TODO permiso que el gateway exige EXISTE en la base (datos iniciales)", () => {
    const exigidos = unicos([...reglas.matchAll(/"([A-Z]+_[A-Z_]+)"/g)].map((m) => m[1]));
    const faltan = exigidos.filter((p) => !permisosEnBase.includes(p));
    assert.deepEqual(faltan, [],
      "El gateway exige permisos que no existen en la base: " + faltan.join(", ") +
      ". Sin ellos solo el SUPERADMIN puede usar esas funciones.");
  });

  test("TODO permiso que usa el frontend EXISTE en la base", () => {
    const usados = [];
    for (const f of archivos(join(RAIZ, "frontend", "src"), (r) => /\.(ts|tsx)$/.test(r))) {
      const t = readFileSync(f, "utf8");
      for (const m of t.matchAll(/(?:puede\(|permiso:\s*)"([A-Z]+_[A-Z_]+)"/g)) usados.push(m[1]);
    }
    const faltan = unicos(usados).filter((p) => !permisosEnBase.includes(p));
    assert.ok(usados.length > 10);
    assert.deepEqual(faltan, [], "El frontend usa permisos que no existen en la base: " + faltan.join(", "));
  });
});

// ======================================================= QUIEN HIZO QUE
describe("servicios: registro de 'quien hizo el cambio' (actor)", () => {
  test("los 8 servicios tienen el MISMO actor.ts", () => {
    const hashes = SERVICIOS.map((s) => {
      const ruta = join(RAIZ, "services", s, "src", "actor", "actor.ts");
      assert.ok(existsSync(ruta), `falta services/${s}/src/actor/actor.ts`);
      return [s, createHash("sha1").update(readFileSync(ruta, "utf8").replace(/\r/g, "")).digest("hex")];
    });
    const distintos = hashes.filter(([, h]) => h !== hashes[0][1]).map(([s]) => s);
    assert.deepEqual(distintos, [], "actor.ts distinto al de users en: " + distintos.join(", "));
  });

  for (const s of SERVICIOS) {
    test(`${s}/main.ts instala el middleware Y el instalarActor, antes de escuchar`, () => {
      const main = leer("services", s, "src", "main.ts");
      const iMw = main.indexOf("app.use(actorMiddleware)");
      const iIn = main.indexOf("instalarActor(app.get(DataSource))");
      const iLi = main.indexOf("app.listen");
      assert.ok(iMw > -1, "falta app.use(actorMiddleware)");
      assert.ok(iIn > -1, "falta instalarActor(app.get(DataSource))  <- el error que nos paso en inventory");
      assert.ok(iMw < iLi && iIn < iLi, "debe ir ANTES de app.listen");
    });
  }

  test("el gateway reenvia x-usuario-id a los servicios", () => {
    const proxy = leer("gateway", "src", "proxy", "proxy.service.ts");
    assert.match(proxy, /headers\["x-usuario-id"\]\s*=/);
  });
});

// ============================================================ BASE DE DATOS
describe("scripts de base de datos (infra/db-init)", () => {
  const tablasEsquema = new Set([...esquema.matchAll(/CREATE TABLE "(FRM_[A-Z]+)"\."([A-Z_]+)"/g)].map((m) => `${m[1]}.${m[2]}`));

  test("el esquema define 52 tablas", () => assert.equal(tablasEsquema.size, 52));

  test("TODA entidad de TypeORM tiene su tabla en el esquema", () => {
    const sinTabla = [];
    for (const s of [...SERVICIOS, "audit"]) {
      for (const f of archivos(join(RAIZ, "services", s, "src"), (r) => r.endsWith(".entity.ts"))) {
        const m = readFileSync(f, "utf8").match(/@Entity\(\s*\{\s*name:\s*"([A-Z_]+)"/);
        if (!m) continue;
        const existe = [...tablasEsquema].some((t) => t.endsWith("." + m[1]));
        if (!existe) sinTabla.push(`${m[1]} (${s})`);
      }
    }
    assert.deepEqual(sinTabla, [], "Entidades sin tabla en 01-esquema.sql: " + sinTabla.join(", "));
  });

  test("las 40 tablas con trigger existen en el esquema", () => {
    const auditadas = [...triggers.matchAll(/'(FRM_[A-Z]+\.[A-Z_]+)'/g)].map((m) => m[1]);
    assert.equal(auditadas.length, 40);
    assert.equal(new Set(auditadas).size, 40, "hay tablas repetidas en la lista");
    const faltan = auditadas.filter((t) => !tablasEsquema.has(t));
    assert.deepEqual(faltan, []);
  });

  test("los datos iniciales solo cargan tablas que existen", () => {
    const cargadas = unicos([...semillas.matchAll(/^INSERT INTO (FRM_[A-Z]+\.[A-Z_]+)/gm)].map((m) => m[1]));
    const faltan = cargadas.filter((t) => !tablasEsquema.has(t));
    assert.deepEqual(faltan, []);
    assert.ok(cargadas.length >= 12);
  });

  test("los datos iniciales NO traen usuarios ni claves (eso va aparte, en 03)", () => {
    assert.ok(!/INSERT INTO FRM_USERS\.USUARIO\b/.test(semillas));
    assert.ok(!/\$2[aby]\$/.test(semillas));
  });

  test("las claves de los esquemas NO estan escritas en 00-usuarios.sql", () => {
    const usuarios = leer("infra", "db-init", "00-usuarios.sql");
    const claves = [...usuarios.matchAll(/DEFINE pw_\w+\s*=\s*'([^']*)'/g)].map((m) => m[1]);
    assert.equal(claves.length, 9);
    assert.ok(claves.every((c) => c.startsWith("CAMBIAR")), "hay una clave real escrita en el archivo");
  });

  test("el script de SQL Server crea las 4 tablas de auditoria", () => {
    const sql = leer("infra", "db-init", "05-auditdb-sqlserver.sql");
    for (const t of ["BITACORA", "BITACORA_EVENTO", "BITACORA_CONSOLIDADO", "HALLAZGO_BITACORA"]) {
      assert.match(sql, new RegExp("CREATE TABLE dbo\\." + t + "\\b"));
    }
    assert.match(sql, /usuario_app\s+VARCHAR\(30\)/);
  });
});
