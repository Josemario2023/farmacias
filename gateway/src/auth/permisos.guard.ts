import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { PERMISOS_KEY } from "./permisos.decorator";
import { REGLAS_PERMISOS } from "./reglas.map";

@Injectable()
export class PermisosGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest();
    const usuario = req.user;

    // Sin usuario, el JwtAuthGuard ya rechazo antes. Aqui solo autorizamos.
    if (!usuario) return true;

    // El SUPERADMIN pasa siempre, sin revisar permisos uno por uno
    const roles: string[] = usuario.roles ?? [];
    if (roles.includes("SUPERADMIN")) return true;

    // 1) Permisos declarados con el decorador en la ruta
    const declarados = this.reflector.getAllAndOverride<string[]>(PERMISOS_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    // 2) Permisos deducidos de la tabla de reglas (ruta + metodo)
    const porRegla = this.resolverPorRegla(req.method, req.path);

    const requeridos = declarados ?? porRegla;
    if (!requeridos || requeridos.length === 0) return true;   // ruta libre

    const permisos: string[] = usuario.permisos ?? [];
    const tienePermiso = requeridos.some((p) => permisos.includes(p));

    if (!tienePermiso) {
      throw new ForbiddenException(
        "No tienes permiso para esta operacion. Se requiere: " + requeridos.join(" o "),
      );
    }
    return true;
  }

  // Busca en la tabla de reglas el permiso que corresponde a esta ruta
  private resolverPorRegla(method: string, path: string): string[] | null {
    const ruta = path.replace(/^\//, "");
    const primerSegmento = ruta.split("/")[0];

    const regla = REGLAS_PERMISOS[primerSegmento];
    if (!regla) return null;

    // GET = lectura, el resto = escritura
    const esLectura = method === "GET";
    const requerido = esLectura ? regla.ver : regla.gestionar;

    return requerido ? [requerido] : null;
  }
}