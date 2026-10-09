/**
 * PRUEBAS DE LAS UTILIDADES DEL FRONTEND
 * Se ejecutan con el ejecutor de pruebas que trae Node (node:test), sin instalar nada:
 *     node --test pruebas/frontend/utilidades.test.ts
 *
 * Solo se prueban funciones PURAS (reciben datos y devuelven datos), que son las
 * faciles de verificar sin abrir el navegador.
 */
import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

import { conIva, TASA_IVA } from "../../frontend/src/utils/iva.ts";
import {
  nombreTabla, nombreModulo, infoOperacion, nombreCampo,
  descomponerJson, resumirCambio, traducirValor,
} from "../../frontend/src/utils/traducirAuditoria.ts";
import { exportarCsv } from "../../frontend/src/utils/exportar.ts";

// ---------------------------------------------------------------- IVA
describe("iva.ts", () => {
  test("la tasa es 12%", () => {
    assert.equal(TASA_IVA, 0.12);
  });

  test("conIva suma el 12% al precio base", () => {
    assert.equal(conIva(100), 112);
    assert.equal(conIva(0), 0);
    assert.equal(conIva(50), 56);
  });

  test("conIva redondea a 2 decimales", () => {
    assert.equal(conIva(10.99), 12.31);   // 12.3088 -> 12.31
    assert.equal(conIva(2.5), 2.8);       // 2.8 exacto
    assert.equal(conIva(0.01), 0.01);     // 0.0112 -> 0.01
  });

  test("DESGLOSE de factura: total = subtotal + IVA y el subtotal recupera el precio base", () => {
    // Misma formula que billing: impuesto = total - total/1.12 ; subtotal = total - impuesto
    const redondear = (n: number) => Math.round(n * 100) / 100;
    for (const base of [1, 2.5, 10.99, 33.33, 100, 249.9, 1234.56]) {
      const total = conIva(base);
      const impuesto = redondear(total - total / (1 + TASA_IVA));
      const subtotal = redondear(total - impuesto);
      assert.equal(redondear(subtotal + impuesto), total, `total no cuadra para base ${base}`);
      assert.ok(Math.abs(subtotal - base) <= 0.01, `subtotal ${subtotal} se aleja de la base ${base}`);
    }
  });

  test("ejemplo del sistema: base Q100 -> subtotal Q100, IVA Q12, total Q112", () => {
    const total = conIva(100);
    const impuesto = Math.round((total - total / 1.12) * 100) / 100;
    assert.deepEqual({ subtotal: total - impuesto, impuesto, total }, { subtotal: 100, impuesto: 12, total: 112 });
  });
});

// ------------------------------------------------- traducirAuditoria.ts
describe("traducirAuditoria.ts", () => {
  test("nombreTabla traduce las tablas conocidas y limpia las desconocidas", () => {
    assert.equal(nombreTabla("VENTA"), "Venta");
    assert.equal(nombreTabla("PAGO_PLANILLA"), "Pago de planilla");
    assert.equal(nombreTabla("TABLA_NUEVA_X"), "tabla nueva x"); // sin traduccion: minusculas y sin guiones bajos
  });

  test("nombreModulo traduce el esquema", () => {
    assert.equal(nombreModulo("FRM_POS"), "Punto de venta");
    assert.equal(nombreModulo("FRM_PAYROLL"), "Planilla");
    assert.equal(nombreModulo("FRM_DELIVERY"), "Entregas");
    assert.equal(nombreModulo("FRM_OTRO"), "OTRO");
  });

  test("infoOperacion da etiqueta y color", () => {
    assert.deepEqual(infoOperacion("INSERT"), { label: "Creación", color: "green" });
    assert.deepEqual(infoOperacion("UPDATE"), { label: "Modificación", color: "orange" });
    assert.deepEqual(infoOperacion("DELETE"), { label: "Eliminación", color: "red" });
    assert.deepEqual(infoOperacion("RARA"), { label: "RARA", color: "default" });
  });

  test("nombreCampo traduce campos y deja el resto legible", () => {
    assert.equal(nombreCampo("solicitado_por"), "Solicitó");
    assert.equal(nombreCampo("usuario_id"), "Usuario");
    assert.equal(nombreCampo("campo_raro_x"), "campo raro x");
  });

  describe("descomponerJson", () => {
    test("devuelve lista vacia con null o JSON invalido", () => {
      assert.deepEqual(descomponerJson(null), []);
      assert.deepEqual(descomponerJson("esto no es json"), []);
    });

    test("omite los valores nulos o vacios", () => {
      const r = descomponerJson(JSON.stringify({ nombre: "Ana", puesto: null, extra: "" }));
      assert.deepEqual(r, [{ campo: "Nombre", valor: "Ana" }]);
    });

    test("da formato a 'activo' (1 = Sí, 0 = No)", () => {
      assert.equal(descomponerJson('{"activo":1}')[0].valor, "Sí");
      assert.equal(descomponerJson('{"activo":0}')[0].valor, "No");
    });

    test("da formato de dinero a precios, totales y montos", () => {
      const r = descomponerJson('{"precio_base":25.5,"total":100,"monto_pagado":3}');
      assert.deepEqual(r.map((x) => x.valor), ["Q 25.50", "Q 100.00", "Q 3.00"]);
    });
  });

  describe("resumirCambio", () => {
    test("usa el nombre legible del registro cuando existe", () => {
      const s = resumirCambio({ tabla: "EMPLEADO", operacion: "INSERT", clavePk: "5", valoresNuevos: '{"nombre":"Ana"}' });
      assert.equal(s, "Empleado Ana · creación");
    });

    test("prefiere numero > codigo > nombre", () => {
      const s = resumirCambio({
        tabla: "VENTA", operacion: "UPDATE", clavePk: "9",
        valoresNuevos: '{"nombre":"N","codigo":"C","numero":"V-001"}',
      });
      assert.equal(s, "Venta V-001 · modificación");
    });

    test("si no hay nada legible, usa #clave primaria", () => {
      assert.equal(
        resumirCambio({ tabla: "ROL_PERMISO", operacion: "DELETE", clavePk: "1-5", valoresNuevos: null }),
        "Permiso de un rol #1-5 · eliminación",
      );
      assert.equal(
        resumirCambio({ tabla: "VENTA", operacion: "INSERT", clavePk: "7", valoresNuevos: "{roto" }),
        "Venta #7 · creación",
      );
    });
  });

  describe("traducirValor (ids -> nombres)", () => {
    const cat = {
      usuario: (id: any) => "Usuario#" + id,
      sucursal: (id: any) => "Sucursal#" + id,
      region: (id: any) => "Region#" + id,
      producto: (id: any) => "Producto#" + id,
      lote: (id: any) => "Lote#" + id,
    };

    test("traduce quien hizo el cambio en traslados y demas", () => {
      for (const campo of ["Usuario", "Solicitó", "Autorizó", "Recibió"]) {
        assert.equal(traducirValor(campo, "3", cat), "Usuario#3", campo);
      }
    });

    test("traduce sucursal, region, producto y lote", () => {
      assert.equal(traducirValor("Sucursal", "1", cat), "Sucursal#1");
      assert.equal(traducirValor("Región", "2", cat), "Region#2");
      assert.equal(traducirValor("Producto", "4", cat), "Producto#4");
      assert.equal(traducirValor("Lote", "5", cat), "Lote#5");
    });

    test("deja igual los campos que no son ids", () => {
      assert.equal(traducirValor("Nombre", "Ana", cat), "Ana");
    });
  });

  // PRUEBA CRUZADA: lo que se audita en la base debe poder leerse en español en la pantalla
  describe("cobertura de la bitacora (cruza el script SQL con el traductor)", () => {
    const sql = readFileSync(new URL("../../infra/db-init/04-triggers-bitacora.sql", import.meta.url), "utf8");
    // 'FRM_ESQUEMA.TABLA' dentro de la lista del script
    const auditadas = [...sql.matchAll(/'(FRM_[A-Z]+)\.([A-Z_]+)'/g)].map((m) => ({ esquema: m[1], tabla: m[2] }));

    test("el script audita 40 tablas", () => {
      assert.equal(auditadas.length, 40);
    });

    test("TODA tabla auditada tiene nombre en español", () => {
      const sinNombre = auditadas.filter((a) => nombreTabla(a.tabla) === a.tabla.replace(/_/g, " ").toLowerCase());
      assert.deepEqual(sinNombre, [], "Tablas auditadas sin traduccion: " + JSON.stringify(sinNombre));
    });

    test("TODO esquema auditado tiene nombre de modulo", () => {
      const esquemas = [...new Set(auditadas.map((a) => a.esquema))];
      const sinModulo = esquemas.filter((e) => nombreModulo(e) === e.replace("FRM_", ""));
      assert.deepEqual(sinModulo, []);
    });
  });
});

// ------------------------------------------------------------- exportar.ts
describe("exportar.ts (exportarCsv)", () => {
  // Simula el navegador: captura el archivo que se "descargaria"
  async function exportar(columnas: any[], filas: any[], separador?: "," | ";") {
    let blob: Blob | undefined;
    let nombre = "";
    (globalThis as any).document = {
      createElement: () => ({ click() {}, set download(v: string) { nombre = v; }, set href(_v: string) {} }),
      body: { appendChild() {}, removeChild() {} },
    };
    URL.createObjectURL = (b: any) => { blob = b; return "blob:falso"; };
    URL.revokeObjectURL = () => {};

    exportarCsv("ventas", columnas, filas, separador);
    // Blob.text() descarta el BOM al decodificar; se leen los bytes para conservarlo
    const bytes = await blob!.arrayBuffer();
    const texto = new TextDecoder("utf-8", { ignoreBOM: true }).decode(bytes);
    return { texto, nombre };
  }

  const columnas = [
    { titulo: "Número", valor: (f: any) => f.numero },
    { titulo: "Total", valor: (f: any) => f.total },
  ];

  test("empieza con BOM y la instruccion sep= para que Excel lo lea bien", async () => {
    const { texto } = await exportar(columnas, [{ numero: "V-1", total: 10 }]);
    assert.ok(texto.startsWith("﻿sep=,\r\n"));
  });

  test("escribe encabezado y filas separados por CRLF", async () => {
    const { texto } = await exportar(columnas, [{ numero: "V-1", total: 10 }, { numero: "V-2", total: 20 }]);
    assert.ok(texto.endsWith("Número,Total\r\nV-1,10\r\nV-2,20"));
  });

  test("encierra entre comillas lo que tiene coma, comillas o saltos de linea", async () => {
    const { texto } = await exportar(columnas, [
      { numero: 'Ana, "la jefa"', total: 1 },
      { numero: "linea1\nlinea2", total: 2 },
    ]);
    assert.ok(texto.includes('"Ana, ""la jefa""",1'), "comillas dobles escapadas");
    assert.ok(texto.includes('"linea1\nlinea2",2'));
  });

  test("los valores nulos salen como celdas vacias", async () => {
    const { texto } = await exportar(columnas, [{ numero: null, total: undefined }]);
    assert.ok(texto.endsWith("\r\n,"));
  });

  test("con separador ';' usa punto y coma y lo declara", async () => {
    const { texto } = await exportar(columnas, [{ numero: "a;b", total: 3 }], ";");
    assert.ok(texto.startsWith("﻿sep=;\r\n"));
    assert.ok(texto.includes('"a;b";3'));
  });

  test("el archivo se llama nombre_AAAA-MM-DD.csv", async () => {
    const { nombre } = await exportar(columnas, []);
    assert.match(nombre, /^ventas_\d{4}-\d{2}-\d{2}\.csv$/);
  });
});
