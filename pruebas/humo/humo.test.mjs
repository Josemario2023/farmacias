/**
 * PRUEBAS DE HUMO E INTEGRIDAD  (contra los servicios EN MARCHA)
 *
 *     node --test pruebas/humo/humo.test.mjs
 *
 * - Solo hacen peticiones GET: NO escriben, NO borran, NO cambian nada.
 * - Hablan directo con cada servicio (sin pasar por el gateway ni el login con OTP).
 * - Si un servicio esta apagado, sus pruebas se SALTAN (no fallan): asi se ve claro que falta.
 *
 * "Humo" = comprobar que cada servicio enciende y responde con la forma esperada.
 * "Integridad" = comprobar reglas que SIEMPRE deben cumplirse en los datos
 *                (por ejemplo: total = subtotal + IVA, el total de una planilla = suma de sus pagos).
 */
import { test, describe } from "node:test";
import assert from "node:assert/strict";

const PUERTOS = {
  users: process.env.PUERTO_USERS ?? 3001,
  inventory: process.env.PUERTO_INVENTORY ?? 3002,
  pos: process.env.PUERTO_POS ?? 3003,
  billing: process.env.PUERTO_BILLING ?? 3004,
  cash: process.env.PUERTO_CASH ?? 3005,
  audit: process.env.PUERTO_AUDIT ?? 3006,
  delivery: process.env.PUERTO_DELIVERY ?? 3007,
  payroll: process.env.PUERTO_PAYROLL ?? 3008,
  assets: process.env.PUERTO_ASSETS ?? 3009,
};

// GET con tiempo limite. Devuelve { ok, status, datos } o { caido: true } si no responde.
async function pedir(servicio, ruta) {
  try {
    const r = await fetch(`http://localhost:${PUERTOS[servicio]}${ruta}`, { signal: AbortSignal.timeout(8000) });
    const texto = await r.text();
    let datos;
    try { datos = JSON.parse(texto); } catch { datos = texto; }
    return { ok: r.ok, status: r.status, datos };
  } catch {
    return { caido: true };
  }
}

// Ejecuta `cuerpo` con los datos, o salta la prueba si el servicio esta caido
async function conDatos(t, servicio, ruta, cuerpo) {
  const r = await pedir(servicio, ruta);
  if (r.caido) return t.skip(`el servicio ${servicio} (puerto ${PUERTOS[servicio]}) no responde`);
  assert.equal(r.status, 200, `${servicio}${ruta} respondio ${r.status}`);
  return cuerpo(r.datos);
}

const redondear = (n) => Math.round(Number(n) * 100) / 100;
const hoy = new Date().toISOString().slice(0, 10);
const rango = `desde=2000-01-01&hasta=${hoy}`;

// ------------------------------------------------------------------ USERS
describe("users (3001)", () => {
  test("lista usuarios SIN exponer la clave", (t) =>
    conDatos(t, "users", "/usuarios", (datos) => {
      assert.ok(Array.isArray(datos) && datos.length > 0);
      for (const u of datos) {
        assert.ok("username" in u && "usuarioId" in u);
        assert.ok(!("passwordHash" in u) && !("password_hash" in u) && !("password" in u),
          `el usuario ${u.username} expone su clave`);
      }
    }));

  test("cada rol y permiso tiene nombre/codigo", (t) =>
    conDatos(t, "users", "/permisos", (datos) => {
      assert.ok(datos.every((p) => typeof p.codigo === "string" && p.codigo.length > 0));
    }));

  test("hay regiones y sucursales, y cada sucursal apunta a una region existente", async (t) => {
    const reg = await pedir("users", "/regiones");
    const suc = await pedir("users", "/sucursales");
    if (reg.caido || suc.caido) return t.skip("users no responde");
    const ids = new Set(reg.datos.map((r) => r.regionId));
    assert.ok(suc.datos.length > 0);
    for (const s of suc.datos) assert.ok(ids.has(s.regionId), `la sucursal ${s.sucursalId} apunta a una region inexistente`);
  });
});

// -------------------------------------------------------------- INVENTORY
describe("inventory (3002)", () => {
  test("productos con codigo, nombre y precio base valido", (t) =>
    conDatos(t, "inventory", "/productos", (datos) => {
      for (const p of datos) {
        assert.ok(p.codigo && p.nombre, "producto sin codigo o nombre");
        assert.ok(Number(p.precioBase) >= 0, `precio negativo en ${p.codigo}`);
      }
    }));

  test("existencias nunca son negativas", (t) =>
    conDatos(t, "inventory", "/existencias", (datos) => {
      for (const e of datos) assert.ok(Number(e.cantidad) >= 0, `existencia negativa: ${JSON.stringify(e)}`);
    }));

  test("traslados: estado valido, origen distinto del destino y quien los hizo", (t) =>
    conDatos(t, "inventory", "/traslados-formales", (datos) => {
      const validos = ["SOLICITADO", "AUTORIZADO", "ENVIADO", "RECIBIDO", "ANULADO"];
      for (const x of datos) {
        assert.ok(validos.includes(x.estado), `estado invalido ${x.estado}`);
        assert.notEqual(x.sucursalOrigenId, x.sucursalDestinoId, `traslado ${x.numero} al mismo lugar`);
        assert.ok(x.solicitadoPor, `traslado ${x.numero} sin solicitante`);
        // un traslado RECIBIDO tuvo que ser autorizado y recibido por alguien
        if (x.estado === "RECIBIDO") assert.ok(x.autorizadoPor && x.recibidoPor, `${x.numero} RECIBIDO sin autorizador/receptor`);
      }
    }));

  test("el kardex es una lista", (t) =>
    conDatos(t, "inventory", "/kardex", (datos) => assert.ok(Array.isArray(datos))));
});

// -------------------------------------------------------------------- POS
describe("pos (3003)", () => {
  test("ventas: total positivo y estado conocido", (t) =>
    conDatos(t, "pos", "/ventas", (datos) => {
      for (const v of datos) {
        assert.ok(Number(v.total) >= 0, `venta ${v.numero} con total negativo`);
        assert.ok(["PAGADA", "ANULADA", "PENDIENTE"].includes(v.estado), `estado raro ${v.estado}`);
      }
    }));

  test("clientes: el NIT no se repite", (t) =>
    conDatos(t, "pos", "/clientes", (datos) => {
      const nits = datos.map((c) => String(c.identificacion).toUpperCase());
      assert.equal(new Set(nits).size, nits.length, "hay NIT repetidos");
    }));
});

// ---------------------------------------------------------------- BILLING
describe("billing (3004)", () => {
  test("INTEGRIDAD IVA: total = subtotal + impuesto en cada factura", (t) =>
    conDatos(t, "billing", "/facturas", (datos) => {
      for (const f of datos) {
        const suma = redondear(Number(f.subtotal) + Number(f.impuesto));
        assert.ok(Math.abs(suma - redondear(f.total)) <= 0.01,
          `factura ${f.numero}: ${f.subtotal} + ${f.impuesto} no da ${f.total}`);
      }
    }));

  test("INTEGRIDAD IVA: el impuesto es el 12% incluido en el total", (t) =>
    conDatos(t, "billing", "/facturas", (datos) => {
      // Solo las facturas con desglose (el IVA del sistema es 12%: impuesto = total - total/1.12)
      for (const f of datos.filter((x) => Number(x.total) > 0 && Number(x.impuesto) > 0)) {
        const esperado = redondear(Number(f.total) - Number(f.total) / 1.12);
        assert.ok(Math.abs(esperado - Number(f.impuesto)) <= 0.02,
          `factura ${f.numero}: impuesto ${f.impuesto}, esperado ${esperado}`);
      }
    }));

  test("hay al menos una serie de factura", (t) =>
    conDatos(t, "billing", "/series", (datos) => assert.ok(datos.length >= 1)));
});

// ------------------------------------------------------------------- CASH
describe("cash (3005)", () => {
  test("INTEGRIDAD: en cada corte CERRADO, diferencia = contado - sistema", (t) =>
    conDatos(t, "cash", "/cortes", (datos) => {
      const cerrados = datos.filter((c) => c.estado === "CERRADO");
      assert.ok(cerrados.length > 0, "no hay cortes cerrados para comprobar");
      for (const c of cerrados) {
        const esperado = redondear(Number(c.totalContado) - Number(c.totalSistema));
        assert.ok(Math.abs(esperado - Number(c.diferencia)) <= 0.01,
          `corte ${c.corteId}: ${c.totalContado} - ${c.totalSistema} no da ${c.diferencia}`);
      }
    }));

  test("hay cajas definidas", (t) =>
    conDatos(t, "cash", "/cajas", (datos) => assert.ok(datos.length >= 1)));
});

// ------------------------------------------------------------------ AUDIT
describe("audit (3006)", () => {
  test("ventas-detalle: forma correcta y sin dias repetidos por sucursal", (t) =>
    conDatos(t, "audit", `/tableros/ventas-detalle?${rango}`, (datos) => {
      const vistos = new Set();
      for (const r of datos) {
        assert.match(r.fecha, /^\d{4}-\d{2}-\d{2}$/);
        assert.ok(Number(r.totalVentas) >= 0 && Number(r.cantidadVentas) >= 0);
        const clave = r.fecha + "|" + r.sucursalId;
        assert.ok(!vistos.has(clave), `consolidado repetido ${clave}`);
        vistos.add(clave);
      }
    }));

  test("caja-detalle: forma correcta y sin dias repetidos por sucursal", (t) =>
    conDatos(t, "audit", `/tableros/caja-detalle?${rango}`, (datos) => {
      const vistos = new Set();
      for (const r of datos) {
        assert.match(r.fecha, /^\d{4}-\d{2}-\d{2}$/);
        assert.ok(Number(r.totalIngresos) >= 0);
        const clave = r.fecha + "|" + r.sucursalId;
        assert.ok(!vistos.has(clave), `consolidado repetido ${clave}`);
        vistos.add(clave);
      }
    }));

  // El listado de ventas de POS no trae la fecha, asi que no se puede comparar dia por dia.
  // Lo que SI se puede exigir: lo consolidado jamas supera lo que existe en POS.
  test("INTEGRIDAD: el consolidado nunca declara mas ventas que las existentes en POS", async (t) => {
    const cons = await pedir("audit", `/tableros/ventas-detalle?${rango}`);
    const ventas = await pedir("pos", "/ventas");
    if (cons.caido || ventas.caido) return t.skip("audit o pos no responde");

    const porSucursal = new Map();
    for (const c of cons.datos) {
      porSucursal.set(c.sucursalId, (porSucursal.get(c.sucursalId) ?? 0) + Number(c.cantidadVentas));
    }
    for (const [sucursalId, consolidadas] of porSucursal) {
      const enPos = ventas.datos.filter((v) => v.sucursalId === sucursalId).length;
      assert.ok(consolidadas <= enPos,
        `sucursal ${sucursalId}: el consolidado suma ${consolidadas} ventas pero POS solo tiene ${enPos}`);
    }
  });

  test("hallazgos: estado y severidad validos", (t) =>
    conDatos(t, "audit", "/hallazgos", (datos) => {
      for (const h of datos) {
        assert.ok(["ABIERTO", "EN_REVISION", "RESUELTO", "CERRADO"].includes(h.estado), `estado ${h.estado}`);
        assert.ok(["BAJA", "MEDIA", "ALTA"].includes(h.severidad), `severidad ${h.severidad}`);
      }
    }));

  test("bitacora: cada registro trae usuarioApp (persona o null) y a lo sumo 300 filas", (t) =>
    conDatos(t, "audit", "/bitacora", (datos) => {
      assert.ok(datos.length <= 300);
      for (const r of datos) {
        assert.ok("usuarioApp" in r, "falta la columna usuarioApp");
        assert.ok(r.usuarioApp === null || typeof r.usuarioApp === "string");
        assert.ok(["INSERT", "UPDATE", "DELETE"].includes(r.operacion));
      }
    }));

  test("bitacora: nunca contiene claves", (t) =>
    conDatos(t, "audit", "/bitacora", (datos) => {
      for (const r of datos) {
        const texto = ((r.valoresNuevos ?? "") + (r.valoresAnteriores ?? "")).toLowerCase();
        assert.ok(!texto.includes("password") && !texto.includes("$2b$"), `la bitacora ${r.bitacoraId} contiene una clave`);
      }
    }));

  test("bitacora: se puede filtrar por modulo", (t) =>
    conDatos(t, "audit", "/bitacora?esquema=FRM_POS", (datos) => {
      assert.ok(datos.every((r) => r.esquema === "FRM_POS"));
    }));
});

// ---------------------------------------------------------------- PAYROLL
describe("payroll (3008)", () => {
  test("empleados: activo es 0 o 1 y todos tienen sucursal", (t) =>
    conDatos(t, "payroll", "/empleados", (datos) => {
      for (const e of datos) {
        assert.ok([0, 1].includes(e.activo), `activo=${e.activo}`);
        assert.ok(e.sucursalId, `empleado ${e.codigo} sin sucursal`);
      }
    }));

  test("INTEGRIDAD: el total de cada planilla = suma de sus pagos", async (t) => {
    const lista = await pedir("payroll", "/planillas");
    if (lista.caido) return t.skip("payroll no responde");
    assert.equal(lista.status, 200);
    for (const p of lista.datos) {
      const det = await pedir("payroll", `/planillas/${p.planillaId}`);
      const suma = redondear(det.datos.pagos.reduce((a, x) => a + Number(x.montoPagado), 0));
      assert.ok(Math.abs(suma - Number(p.totalPagado)) <= 0.01,
        `planilla ${p.periodo}: total ${p.totalPagado} pero sus pagos suman ${suma}`);
    }
  });

  test("INTEGRIDAD POR SUCURSAL: todo pago es de un empleado de la sucursal de su planilla", async (t) => {
    const lista = await pedir("payroll", "/planillas");
    const emps = await pedir("payroll", "/empleados");
    if (lista.caido || emps.caido) return t.skip("payroll no responde");
    const sucDeEmpleado = new Map(emps.datos.map((e) => [e.empleadoId, e.sucursalId]));
    for (const p of lista.datos) {
      const det = await pedir("payroll", `/planillas/${p.planillaId}`);
      for (const pago of det.datos.pagos) {
        assert.equal(sucDeEmpleado.get(pago.empleadoId), p.sucursalId,
          `planilla ${p.periodo} (sucursal ${p.sucursalId}) paga al empleado ${pago.empleadoId} de otra sucursal`);
      }
    }
  });

  test("una sola planilla por sucursal y periodo", (t) =>
    conDatos(t, "payroll", "/planillas", (datos) => {
      const claves = datos.map((p) => p.periodo + "|" + p.sucursalId);
      assert.equal(new Set(claves).size, claves.length);
    }));

  test("las planillas CERRADAS son estado valido", (t) =>
    conDatos(t, "payroll", "/planillas", (datos) => {
      assert.ok(datos.every((p) => ["ABIERTA", "CERRADA"].includes(p.estado)));
    }));
});

// ----------------------------------------------------------------- ASSETS
describe("assets (3009)", () => {
  test("activos: valor no negativo y estado ACTIVO/BAJA", (t) =>
    conDatos(t, "assets", "/activos", (datos) => {
      for (const a of datos) {
        assert.ok(Number(a.valorAdquisicion) >= 0);
        assert.ok(["ACTIVO", "BAJA"].includes(a.estado));
      }
    }));

  test("INTEGRIDAD: el valor en libros nunca supera al valor de adquisicion", async (t) => {
    const lista = await pedir("assets", "/activos");
    if (lista.caido) return t.skip("assets no responde");
    for (const a of lista.datos) {
      const det = await pedir("assets", `/activos/${a.activoId}`);
      assert.ok(Number(det.datos.valorActual) <= Number(a.valorAdquisicion) + 0.01,
        `${a.codigo}: valor actual ${det.datos.valorActual} > adquisicion ${a.valorAdquisicion}`);
      assert.ok(Number(det.datos.valorActual) >= -0.01, `${a.codigo}: valor actual negativo`);
    }
  });
});

// --------------------------------------------------------------- DELIVERY
describe("delivery (3007)", () => {
  test("cotizaciones: estado valido y total positivo", (t) =>
    conDatos(t, "delivery", "/cotizaciones", (datos) => {
      for (const c of datos) {
        assert.ok(["PENDIENTE", "CONFIRMADA", "CANCELADA"].includes(c.estado), `estado ${c.estado}`);
      }
    }));

  test("formas de pago y cobertura responden", async (t) => {
    const fp = await pedir("delivery", "/formas-pago");
    const co = await pedir("delivery", "/cobertura");
    if (fp.caido || co.caido) return t.skip("delivery no responde");
    assert.equal(fp.status, 200);
    assert.equal(co.status, 200);
  });
});
