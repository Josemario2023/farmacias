import {
  Injectable, CanActivate, ExecutionContext, UnauthorizedException,
} from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { ConfigService } from "@nestjs/config";
import { Reflector } from "@nestjs/core";
import { IS_PUBLIC_KEY } from "./public.decorator";

// 10 minutos de inactividad
const INACTIVITY_MS = 10 * 60 * 1000;

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly jwtService: JwtService,
    private readonly config: ConfigService,
    private readonly reflector: Reflector,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const response = context.switchToHttp().getResponse();

    // 1) Buscar el token: primero en la cookie, luego en la cabecera (respaldo)
    let token: string | undefined = request.cookies?.["token"];
    if (!token) {
      const authHeader = request.headers["authorization"];
      if (authHeader && authHeader.startsWith("Bearer ")) {
        token = authHeader.substring(7);
      }
    }
    if (!token) {
      throw new UnauthorizedException("No autenticado");
    }

    // 2) Verificar la firma del token
    try {
      const payload = await this.jwtService.verifyAsync(token, {
        secret: this.config.get<string>("JWT_SECRET"),
      });
      request.user = payload;

      // 3) RENOVAR la cookie: resetea los 10 min de inactividad
      response.cookie("token", token, {
        httpOnly: true,
        sameSite: "lax",
        secure: false,
        maxAge: INACTIVITY_MS,
      });

      return true;
    } catch {
      throw new UnauthorizedException("Sesion expirada o token invalido");
    }
  }
}