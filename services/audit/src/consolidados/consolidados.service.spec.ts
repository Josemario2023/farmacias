import { ConsolidadosService } from "./consolidados.service";

/**
 * PRUEBAS UNITARIAS DE ConsolidadosService
 *
 * Los "consolidados" son resumenes por dia/sucursal calculados a partir de los eventos.
 * Se prueban con una base FALSA: `dataSource.query` devuelve filas preparadas y anota
 * cada SQL ejecutado, asi podemos revisar el ORDEN de las operaciones.
 */

const repoFalso = () => ({
  create: jest.fn((x: any) => x),
  save: jest.fn(async (x: any) => x),
  delete: jest.fn(),
  find: jest.fn(),
  findOne: jest.fn(),
});

describe("ConsolidadosService", () => {
  let ventas: ReturnType<typeof repoFalso>;
  let hallazgos: ReturnType<typeof repoFalso>;
  let caja: ReturnType<typeof repoFalso>;
  let inventario: ReturnType<typeof repoFalso>;
  let bitacoraSql: jest.Mock; // dataSource.query
  let servicio: ConsolidadosService;
  let orden: string[]; // orden en que ocurrieron las operaciones

  beforeEach(() => {
    ventas = repoFalso();
    hallazgos = repoFalso();
    caja = repoFalso();
    inventario = repoFalso();
    orden = [];
    bitacoraSql = jest.fn();
    servicio = new ConsolidadosService(
      ventas as any, hallazgos as any, caja as any, inventario as any,
      { query: bitacoraSql } as any,
    );
  });

  describe("consolidarVentas", () => {
    // Primera llamada = SELECT de eventos; las siguientes = DELETE
    const preparar = (filas: any[]) => {
      bitacoraSql.mockImplementation(async (sql: string) => {
        if (/^\s*SELECT/i.test(sql)) return filas;
        orden.push("DELETE");
        return undefined;
      });
      ventas.save.mockImplementation(async (x: any) => { orden.push("SAVE"); return x; });
    };

    it("guarda un consolidado por sucursal con total y cantidad", async () => {
      preparar([{ regionId: 1, sucursalId: 1, cantidad: 4, total: 1200 }]);

      const r = await servicio.consolidarVentas("2026-09-22");

      expect(r.sucursalesProcesadas).toBe(1);
      expect(ventas.create).toHaveBeenCalledWith(
        expect.objectContaining({ regionId: 1, sucursalId: 1, totalVentas: 1200, cantidadVentas: 4 }),
      );
    });

    it("REGRESION ORA-00001: borra el dia anterior con SQL por TRUNC(fecha) ANTES de insertar", async () => {
      preparar([{ regionId: 1, sucursalId: 1, cantidad: 4, total: 1200 }]);

      await servicio.consolidarVentas("2026-09-22");

      const delSql = bitacoraSql.mock.calls.find(([sql]) => /DELETE FROM CONSOLIDADO_VENTAS/.test(sql));
      expect(delSql).toBeDefined();
      expect(delSql![0]).toMatch(/TRUNC\(fecha\)/);        // compara solo la fecha, sin hora
      expect(delSql![1]).toEqual(["2026-09-22", 1]);       // dia y sucursal
      expect(ventas.delete).not.toHaveBeenCalled();        // ya NO usa repo.delete (no encontraba la fila)
      expect(orden).toEqual(["DELETE", "SAVE"]);           // primero borra, luego guarda
    });

    it("si hay datos de varias sucursales, borra y guarda cada una", async () => {
      preparar([
        { regionId: 1, sucursalId: 1, cantidad: 2, total: 100 },
        { regionId: 1, sucursalId: 2, cantidad: 1, total: 50 },
      ]);

      const r = await servicio.consolidarVentas("2026-10-07");

      expect(r.sucursalesProcesadas).toBe(2);
      expect(orden).toEqual(["DELETE", "SAVE", "DELETE", "SAVE"]);
    });

    it("sin eventos ese dia no guarda ni borra nada", async () => {
      preparar([]);
      const r = await servicio.consolidarVentas("2026-01-01");
      expect(r.sucursalesProcesadas).toBe(0);
      expect(orden).toEqual([]);
    });

    it("trata valores nulos como cero", async () => {
      preparar([{ regionId: null, sucursalId: 3, cantidad: null, total: null }]);
      await servicio.consolidarVentas("2026-10-08");
      expect(ventas.create).toHaveBeenCalledWith(
        expect.objectContaining({ regionId: 0, totalVentas: 0, cantidadVentas: 0 }),
      );
    });
  });

  describe("consolidarCaja", () => {
    it("el ingreso es lo que el SISTEMA esperaba y guarda el descuadre", async () => {
      bitacoraSql.mockImplementation(async (sql: string) =>
        /^\s*SELECT/i.test(sql) ? [{ regionId: 1, sucursalId: 1, sistema: 290, contado: 289, diferencia: -1, cortes: 3 }] : undefined,
      );

      await servicio.consolidarCaja("2026-10-07");

      expect(caja.create).toHaveBeenCalledWith(
        expect.objectContaining({ totalIngresos: 290, totalEgresos: 0, diferencia: -1 }),
      );
      const del = bitacoraSql.mock.calls.find(([sql]) => /DELETE FROM CONSOLIDADO_CAJA/.test(sql));
      expect(del![0]).toMatch(/TRUNC\(fecha\)/);
      expect(caja.delete).not.toHaveBeenCalled();
    });
  });

  describe("consolidarInventario", () => {
    it("borra por SQL el del dia y guarda el nuevo", async () => {
      await servicio.consolidarInventario("2026-10-08", {
        sucursalId: 1, regionId: 1, valorInventario: 5000, productosBajoMinimo: 2,
      });

      expect(bitacoraSql.mock.calls[0][0]).toMatch(/DELETE FROM CONSOLIDADO_INVENTARIO/);
      expect(bitacoraSql.mock.calls[0][1]).toEqual(["2026-10-08", 1]);
      expect(inventario.save).toHaveBeenCalled();
      expect(inventario.delete).not.toHaveBeenCalled();
    });
  });

  describe("consolidarTodo", () => {
    it("consolida CADA dia con ventas y CADA dia con cierres de caja", async () => {
      // 1a consulta: dias con ventas; 2a: dias con cortes
      bitacoraSql
        .mockResolvedValueOnce([{ dia: "2026-09-22" }, { dia: "2026-10-07" }])
        .mockResolvedValueOnce([{ dia: "2026-10-01" }, { dia: "2026-10-07" }, { dia: "2026-10-08" }]);
      const v = jest.spyOn(servicio, "consolidarVentas").mockResolvedValue({} as any);
      const c = jest.spyOn(servicio, "consolidarCaja").mockResolvedValue({} as any);

      const r = await servicio.consolidarTodo();

      expect(v.mock.calls.map((x) => x[0])).toEqual(["2026-09-22", "2026-10-07"]);
      expect(c.mock.calls.map((x) => x[0])).toEqual(["2026-10-01", "2026-10-07", "2026-10-08"]);
      expect(r).toMatchObject({ diasProcesados: 2, diasCaja: 3 });
    });

    it("sin eventos no procesa ningun dia", async () => {
      bitacoraSql.mockResolvedValue([]);
      const r = await servicio.consolidarTodo();
      expect(r).toMatchObject({ diasProcesados: 0, diasCaja: 0 });
    });
  });

  describe("tableros", () => {
    it("ventasDetalle y cajaDetalle consultan por rango de fechas, sin agrupar", async () => {
      bitacoraSql.mockResolvedValue([]);

      await servicio.ventasDetalle("2026-09-01", "2026-10-31");
      expect(bitacoraSql.mock.calls[0][0]).toMatch(/FROM CONSOLIDADO_VENTAS/);
      expect(bitacoraSql.mock.calls[0][0]).not.toMatch(/GROUP BY/);
      expect(bitacoraSql.mock.calls[0][1]).toEqual(["2026-09-01", "2026-10-31"]);

      await servicio.cajaDetalle("2026-09-01", "2026-10-31");
      expect(bitacoraSql.mock.calls[1][0]).toMatch(/FROM CONSOLIDADO_CAJA/);
      expect(bitacoraSql.mock.calls[1][1]).toEqual(["2026-09-01", "2026-10-31"]);
    });
  });

  describe("bitacora", () => {
    it("incluye usuario_app (quien hizo el cambio) en la consulta", async () => {
      bitacoraSql.mockResolvedValue([]);
      await servicio.consultarBitacora({});
      expect(bitacoraSql.mock.calls[0][0]).toMatch(/usuario_app\s+AS "usuarioApp"/);
    });

    it("arma los filtros con parametros en el orden correcto", async () => {
      bitacoraSql.mockResolvedValue([]);
      await servicio.consultarBitacora({
        esquema: "FRM_POS", tabla: "VENTA", operacion: "INSERT", fechaInicio: "2026-10-01", fechaFin: "2026-10-08",
      });
      expect(bitacoraSql.mock.calls[0][1]).toEqual(["FRM_POS", "VENTA", "INSERT", "2026-10-01", "2026-10-08"]);
      expect(bitacoraSql.mock.calls[0][0]).toMatch(/FETCH FIRST 300 ROWS ONLY/); // tope de filas
    });

    it("sin filtros no manda parametros", async () => {
      bitacoraSql.mockResolvedValue([]);
      await servicio.consultarBitacora({});
      expect(bitacoraSql.mock.calls[0][1]).toEqual([]);
    });
  });

  describe("hallazgos", () => {
    it("cambiarEstado guarda el estado nuevo (RESUELTO)", async () => {
      hallazgos.findOne.mockResolvedValue({ hallazgoId: 1, estado: "ABIERTO" });
      const r = await servicio.cambiarEstado(1, "RESUELTO");
      expect(r.estado).toBe("RESUELTO");
      expect(hallazgos.save).toHaveBeenCalled();
    });

    it("cambiarEstado de un hallazgo inexistente falla", async () => {
      hallazgos.findOne.mockResolvedValue(null);
      await expect(servicio.cambiarEstado(99, "RESUELTO")).rejects.toThrow(/no encontrado/);
    });

    it("un hallazgo nuevo nace ABIERTO y con fecha", async () => {
      await servicio.crearHallazgo({
        tipo: "FALTANTE_CAJA", severidad: "ALTA", descripcion: "x", sucursalId: 1, regionId: 1,
      });
      expect(hallazgos.create).toHaveBeenCalledWith(
        expect.objectContaining({ estado: "ABIERTO", monto: null, creadoEn: expect.any(Date) }),
      );
    });

    it("listarHallazgos solo filtra por lo que se pide", async () => {
      hallazgos.find.mockResolvedValue([]);
      await servicio.listarHallazgos({ estado: "ABIERTO", regionId: "2" });
      expect(hallazgos.find).toHaveBeenCalledWith({
        where: { estado: "ABIERTO", regionId: 2 }, // regionId llega como texto y se convierte a numero
        order: { hallazgoId: "DESC" },
      });
    });
  });
});
