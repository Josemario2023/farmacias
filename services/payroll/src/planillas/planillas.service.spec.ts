import { BadRequestException, ConflictException, NotFoundException } from "@nestjs/common";
import { PlanillasService } from "./planillas.service";

/**
 * PRUEBAS UNITARIAS DE PlanillasService
 *
 * "Unitaria" = se prueba UNA clase aislada. No hay base de datos: los repositorios
 * de TypeORM se reemplazan por objetos falsos (mocks) que devuelven lo que cada
 * prueba necesita. Asi validamos solo las REGLAS DE NEGOCIO.
 */

// Fabrica de repositorios falsos. jest.fn() registra con que argumentos se llamo.
const repoFalso = () => ({
  find: jest.fn(),
  findOne: jest.fn(),
  save: jest.fn(async (x: any) => x), // save devuelve lo mismo que recibe
  create: jest.fn((x: any) => x),     // create devuelve el mismo objeto
  createQueryBuilder: jest.fn(),
});

describe("PlanillasService", () => {
  let empleados: ReturnType<typeof repoFalso>;
  let planillas: ReturnType<typeof repoFalso>;
  let pagos: ReturnType<typeof repoFalso>;
  let servicio: PlanillasService;

  // Se ejecuta antes de CADA prueba: parte siempre de repositorios limpios
  beforeEach(() => {
    empleados = repoFalso();
    planillas = repoFalso();
    pagos = repoFalso();
    servicio = new PlanillasService(empleados as any, planillas as any, pagos as any, {} as any);
  });

  describe("empleados", () => {
    it("crea un empleado nuevo y lo deja ACTIVO (1)", async () => {
      empleados.findOne.mockResolvedValue(null); // no existe ese codigo

      const r = await servicio.crearEmpleado({ codigo: "E-01", nombre: "Ana", sucursalId: 1 });

      expect(r.activo).toBe(1);
      expect(r.puesto).toBeNull();     // puesto opcional -> null
      expect(r.usuarioId).toBeNull();  // usuarioId opcional -> null
    });

    it("rechaza un codigo de empleado repetido (409 Conflict)", async () => {
      empleados.findOne.mockResolvedValue({ empleadoId: 9, codigo: "E-01" });

      await expect(
        servicio.crearEmpleado({ codigo: "E-01", nombre: "Ana", sucursalId: 1 }),
      ).rejects.toBeInstanceOf(ConflictException);
      expect(empleados.save).not.toHaveBeenCalled(); // y NO se guarda nada
    });

    it("dar de baja es logico: activo pasa a 0 y no se borra", async () => {
      empleados.findOne.mockResolvedValue({ empleadoId: 1, activo: 1 });

      const r = await servicio.desactivarEmpleado(1);

      expect(r.activo).toBe(0);
      expect(empleados.save).toHaveBeenCalled();
    });

    it("ver un empleado inexistente da 404", async () => {
      empleados.findOne.mockResolvedValue(null);
      await expect(servicio.verEmpleado(99)).rejects.toBeInstanceOf(NotFoundException);
    });

    it("filtra por sucursal solo si se pide", async () => {
      empleados.find.mockResolvedValue([]);

      await servicio.listarEmpleados();
      expect(empleados.find).toHaveBeenLastCalledWith({ where: {}, order: { nombre: "ASC" } });

      await servicio.listarEmpleados(3);
      expect(empleados.find).toHaveBeenLastCalledWith({
        where: { sucursalId: 3 },
        order: { nombre: "ASC" },
      });
    });
  });

  describe("planillas", () => {
    it("crea la planilla ABIERTA con total 0", async () => {
      planillas.findOne.mockResolvedValue(null);

      const r = await servicio.crearPlanilla({ periodo: "2026-10", sucursalId: 1 });

      expect(r).toMatchObject({ periodo: "2026-10", sucursalId: 1, totalPagado: 0, estado: "ABIERTA" });
    });

    it("solo puede haber UNA planilla por sucursal y periodo (409)", async () => {
      planillas.findOne.mockResolvedValue({ planillaId: 1 });

      await expect(
        servicio.crearPlanilla({ periodo: "2026-10", sucursalId: 1 }),
      ).rejects.toBeInstanceOf(ConflictException);

      // la busqueda de duplicados se hace por periodo Y sucursal
      expect(planillas.findOne).toHaveBeenCalledWith({
        where: { periodo: "2026-10", sucursalId: 1 },
      });
    });

    it("cerrar la planilla cambia el estado a CERRADA", async () => {
      planillas.findOne.mockResolvedValue({ planillaId: 1, estado: "ABIERTA" });
      const r = await servicio.cerrarPlanilla(1);
      expect(r.estado).toBe("CERRADA");
    });

    it("no se puede cerrar dos veces (400)", async () => {
      planillas.findOne.mockResolvedValue({ planillaId: 1, estado: "CERRADA" });
      await expect(servicio.cerrarPlanilla(1)).rejects.toBeInstanceOf(BadRequestException);
    });

    it("cerrar una planilla inexistente da 404", async () => {
      planillas.findOne.mockResolvedValue(null);
      await expect(servicio.cerrarPlanilla(5)).rejects.toBeInstanceOf(NotFoundException);
    });

    it("verPlanilla devuelve la planilla CON sus pagos", async () => {
      planillas.findOne.mockResolvedValue({ planillaId: 1, periodo: "2026-10" });
      pagos.find.mockResolvedValue([{ pagoPlanillaId: 7 }]);

      const r = await servicio.verPlanilla(1);

      expect(r.periodo).toBe("2026-10");
      expect(r.pagos).toEqual([{ pagoPlanillaId: 7 }]);
    });
  });

  describe("registrarPago (reglas de negocio)", () => {
    const dto = { planillaId: 1, empleadoId: 10, tipo: "SALARIO", montoPagado: 1000 };

    // Deja listo un escenario valido; cada prueba cambia solo lo que quiere romper
    const escenarioValido = () => {
      planillas.findOne.mockResolvedValue({ planillaId: 1, sucursalId: 1, estado: "ABIERTA", totalPagado: 0 });
      empleados.findOne.mockResolvedValue({ empleadoId: 10, nombre: "Ana", sucursalId: 1, activo: 1 });
      // createQueryBuilder().select().where().getRawOne() -> { total: 1000 }
      const cadena: any = {};
      cadena.select = jest.fn(() => cadena);
      cadena.where = jest.fn(() => cadena);
      cadena.getRawOne = jest.fn(async () => ({ total: 1000 }));
      pagos.createQueryBuilder.mockReturnValue(cadena);
    };

    it("registra el pago y RECALCULA el total de la planilla", async () => {
      escenarioValido();

      const r = await servicio.registrarPago(dto);

      expect(pagos.save).toHaveBeenCalled();
      expect(r.totalPlanilla).toBe(1000);
      // la planilla se guarda con el total nuevo
      expect(planillas.save).toHaveBeenCalledWith(expect.objectContaining({ totalPagado: 1000 }));
    });

    it("rechaza si la planilla no existe", async () => {
      escenarioValido();
      planillas.findOne.mockResolvedValue(null);
      await expect(servicio.registrarPago(dto)).rejects.toBeInstanceOf(BadRequestException);
    });

    it("rechaza pagos en una planilla CERRADA", async () => {
      escenarioValido();
      planillas.findOne.mockResolvedValue({ planillaId: 1, sucursalId: 1, estado: "CERRADA" });
      await expect(servicio.registrarPago(dto)).rejects.toThrow(/CERRADA/);
      expect(pagos.save).not.toHaveBeenCalled();
    });

    it("rechaza si el empleado no existe", async () => {
      escenarioValido();
      empleados.findOne.mockResolvedValue(null);
      await expect(servicio.registrarPago(dto)).rejects.toBeInstanceOf(BadRequestException);
    });

    it("rechaza pagar a un empleado dado de BAJA", async () => {
      escenarioValido();
      empleados.findOne.mockResolvedValue({ empleadoId: 10, nombre: "Ana", sucursalId: 1, activo: 0 });
      await expect(servicio.registrarPago(dto)).rejects.toThrow(/baja/);
      expect(pagos.save).not.toHaveBeenCalled();
    });

    it("REGLA POR SUCURSAL: rechaza al empleado de OTRA sucursal", async () => {
      escenarioValido();
      empleados.findOne.mockResolvedValue({ empleadoId: 10, nombre: "Ana", sucursalId: 2, activo: 1 });

      await expect(servicio.registrarPago(dto)).rejects.toThrow(/sucursal/);
      expect(pagos.save).not.toHaveBeenCalled(); // no se guarda nada
      expect(planillas.save).not.toHaveBeenCalled();
    });
  });
});
