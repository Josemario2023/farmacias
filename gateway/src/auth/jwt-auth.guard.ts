import {
  Injectable, CanActivate, ExecutionContext, UnauthorizedException,
} from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { ConfigService } from "@nestjs/config";
import { Reflector } from "@nestjs/core";
import { IS_PUBLIC_KEY } from "./public.decorator";

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly jwtService: JwtService,
    private readonly config: ConfigService,
    private readonly reflector: Reflector,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // 1) Si la ruta esta marcada @Public(), dejar pasar sin token
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) {
      return true;
    }

    // 2) Buscar el token en la cabecera "Authorization: Bearer <token>"
    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers["authorization"];
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      throw new UnauthorizedException("Falta el token");
    }
    const token = authHeader.substring(7); // quita "Bearer "

    // 3) Verificar la firma del token con el mismo secreto que uso users
    try {
      const payload = await this.jwtService.verifyAsync(token, {
        secret: this.config.get<string>("JWT_SECRET"),
      });
      request.user = payload; // guardamos el contenido del token por si se necesita
      return true;
    } catch {
      throw new UnauthorizedException("Token invalido o expirado");
    }
  }
}
