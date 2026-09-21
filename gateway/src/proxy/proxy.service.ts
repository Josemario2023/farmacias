import { Injectable, HttpException } from "@nestjs/common";
import { HttpService } from "@nestjs/axios";
import { ConfigService } from "@nestjs/config";
import { firstValueFrom } from "rxjs";
import { AxiosError } from "axios";

@Injectable()
export class ProxyService {
  constructor(
    private readonly http: HttpService,
    private readonly config: ConfigService,
  ) {}

  // Reenvia una peticion al servicio users y devuelve su respuesta
  async forwardToUsers(method: string, path: string, body?: any): Promise<any> {
    const baseUrl = this.config.get<string>("USERS_SERVICE_URL");
    const url = baseUrl + path;

    try {
      const response = await firstValueFrom(
        this.http.request({ method, url, data: body }),
      );
      return response.data;
    } catch (error) {
      // Si users respondio con un error (ej. 401), lo reenviamos tal cual
      const axiosError = error as AxiosError;
      if (axiosError.response) {
        throw new HttpException(
          axiosError.response.data as any,
          axiosError.response.status,
        );
      }
      // Si users no respondio (esta caido), avisamos
      throw new HttpException("El servicio users no responde", 503);
    }
  }
}
