import { ForbiddenException } from "@nestjs/common";
import { PermisosGuard } from "./permisos.guard";
import { REGLAS_ACCION, REGLAS_PERMISOS } from "./reglas.map";

/**
 * PRUEBAS UNITARIAS DEL GUARDIAN DE PERMISOS (PermisosGuard)
 *
 * El guardian decide, para cada peticion que llega al gateway, si el usuario
 * tiene el permiso necesario. Aqui NO se levanta Nest ni HTTP: se arma una
 * "peticion falsa" con { user, method, path } y se llama a canActivate().
 */

// Reflector falso: devuelve los permisos "declarados con decorador" (o undefined)
const reflectorSin = () => ({ getAllAndOverride: jest.fn(() => undefined) }) as any;

// ExecutionContext falso: lo minimo que usa el guardian
const contexto = (req: any) =>
  ({
    switchToHttp: () => ({ getRequest: () => req }),
    getHandler: () => ({}),
    getClass: () => ({}),
  }) as any;

const guardian = () => new PermisosGuard(reflectorSin());

// Atajo para llamar al guardian con un usuario, metodo y ruta
const intentar = (user: any, method: string, path: string) =>
  guardian().canActivate(contexto({ user, method, path }));

describe("PermisosGuard", () => {
  describe("casos generales", () => {
    it("sin usuario deja pasar (el JwtAuthGuard ya rechazo antes)", () => {
      expect(intentar(undefined, "GET", "/facturas")).toBe(true);
    });

    it("el SUPERADMIN pasa siempre, aunque no tenga permisos", () => {
      const u = { roles: ["SUPERADMIN"], permisos: [] };
      expect(intentar(u, "POST", "/traslados-formales")).toBe(true);
      expect(intentar(u, "DELETE", "/usuarios/1")).toBe(true);
    });

    it("una ruta sin regla es libre", () => {
      const u = { roles: [], permisos: [] };
      expect(intentar(u, "GET", "/ruta-que-no-existe")).toBe(true);
    });

    it("una ruta con ver vacio (regiones) es libre para leer", () => {
      const u = { roles: [], permisos: [] };
      expect(intentar(u, "GET", "/regiones")).toBe(true);
    });

    it("GET exige el permiso de VER y los demas metodos el de GESTIONAR", () => {
      const soloVer = { roles: ["X"], permisos: ["FACTURA_VER"] };
      expect(intentar(soloVer, "GET", "/facturas")).toBe(true);
      expect(() => intentar(soloVer, "PATCH", "/facturas/1/anular")).toThrow(ForbiddenException);

      const gestor = { roles: ["X"], permisos: ["FACTURA_ANULAR"] };
      expect(intentar(gestor, "PATCH", "/facturas/1/anular")).toBe(true);
    });

    it("el mensaje de error dice QUE permiso faltaba", () => {
      const u = { roles: ["X"], permisos: [] };
      expect(() => intentar(u, "GET", "/facturas")).toThrow(/FACTURA_VER/);
    });

    it("un permiso declarado con decorador manda sobre la tabla de reglas", () => {
      const reflector = { getAllAndOverride: jest.fn(() => ["PERMISO_ESPECIAL"]) } as any;
      const g = new PermisosGuard(reflector);
      const ctx = contexto({ user: { roles: [], permisos: ["PERMISO_ESPECIAL"] }, method: "GET", path: "/facturas" });
      expect(g.canActivate(ctx)).toBe(true); // /facturas pediria FACTURA_VER, pero gana el decorador
    });
  });

  describe("traslados: permisos separados por accion", () => {
    const base = ["TRASLADO_VER"];
    const con = (...extra: string[]) => ({ roles: ["X"], permisos: [...base, ...extra] });

    it("VER: GET /traslados-formales pide TRASLADO_VER", () => {
      expect(intentar(con(), "GET", "/traslados-formales")).toBe(true);
      expect(() => intentar({ roles: ["X"], permisos: [] }, "GET", "/traslados-formales")).toThrow(ForbiddenException);
    });

    it("SOLICITAR: POST /traslados-formales pide TRASLADO_SOLICITAR", () => {
      expect(intentar(con("TRASLADO_SOLICITAR"), "POST", "/traslados-formales")).toBe(true);
      expect(() => intentar(con("TRASLADO_AUTORIZAR"), "POST", "/traslados-formales")).toThrow(/TRASLADO_SOLICITAR/);
    });

    it("RECIBIR: POST /traslados-formales/5/recibir pide TRASLADO_RECIBIR", () => {
      expect(intentar(con("TRASLADO_RECIBIR"), "POST", "/traslados-formales/5/recibir")).toBe(true);
      expect(() => intentar(con("TRASLADO_AUTORIZAR"), "POST", "/traslados-formales/5/recibir")).toThrow(/TRASLADO_RECIBIR/);
    });

    it("AUTORIZAR, ENVIAR y ANULAR siguen pidiendo TRASLADO_AUTORIZAR", () => {
      const gerente = con("TRASLADO_AUTORIZAR");
      expect(intentar(gerente, "PATCH", "/traslados-formales/5/autorizar")).toBe(true);
      expect(intentar(gerente, "POST", "/traslados-formales/5/enviar")).toBe(true);
      expect(intentar(gerente, "PATCH", "/traslados-formales/5/anular")).toBe(true);

      const solicitante = con("TRASLADO_SOLICITAR", "TRASLADO_RECIBIR");
      expect(() => intentar(solicitante, "PATCH", "/traslados-formales/5/autorizar")).toThrow(/TRASLADO_AUTORIZAR/);
      expect(() => intentar(solicitante, "POST", "/traslados-formales/5/enviar")).toThrow(/TRASLADO_AUTORIZAR/);
      expect(() => intentar(solicitante, "PATCH", "/traslados-formales/5/anular")).toThrow(/TRASLADO_AUTORIZAR/);
    });

    it("quien solo autoriza ya NO puede solicitar ni recibir (separacion de funciones)", () => {
      const soloAutoriza = con("TRASLADO_AUTORIZAR");
      expect(() => intentar(soloAutoriza, "POST", "/traslados-formales")).toThrow(ForbiddenException);
      expect(() => intentar(soloAutoriza, "POST", "/traslados-formales/5/recibir")).toThrow(ForbiddenException);
    });

    it("el ID del traslado debe ser numerico para activar la regla de recibir", () => {
      const patron = REGLAS_ACCION.find((r) => r.permiso === "TRASLADO_RECIBIR")!.patron;
      expect(patron.test("traslados-formales/12/recibir")).toBe(true);
      expect(patron.test("traslados-formales/abc/recibir")).toBe(false);
    });
  });

  describe("tabla de reglas (REGLAS_PERMISOS)", () => {
    it("los modulos de planilla y activos exigen sus permisos", () => {
      expect(REGLAS_PERMISOS["planillas"]).toEqual({ ver: "PLANILLA_GESTIONAR", gestionar: "PLANILLA_GESTIONAR" });
      expect(REGLAS_PERMISOS["activos"].gestionar).toBe("ACTIVOS_GESTIONAR");
    });

    it("resolver un hallazgo exige AUDITORIA_RESOLVER", () => {
      const u = { roles: ["X"], permisos: ["AUDITORIA_VER"] };
      expect(() => intentar(u, "PATCH", "/hallazgos/3/estado")).toThrow(/AUDITORIA_RESOLVER/);
      const jefe = { roles: ["X"], permisos: ["AUDITORIA_RESOLVER"] };
      expect(intentar(jefe, "PATCH", "/hallazgos/3/estado")).toBe(true);
    });
  });
});
