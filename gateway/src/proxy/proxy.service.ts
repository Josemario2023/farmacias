import { Injectable, HttpException, NotFoundException } from "@nestjs/common";
import { HttpService } from "@nestjs/axios";
import { ConfigService } from "@nestjs/config";
import { firstValueFrom } from "rxjs";
import { AxiosError } from "axios";
import type { Response } from "express";
import { MAPA_RUTAS } from "./rutas.map";

@Injectable()
export class ProxyService {
  constructor(
    private readonly http: HttpService,
    private readonly config: ConfigService,
  ) {}

  // Resuelve a que servicio va una ruta, segun su primer segmento
  private resolverDestino(path: string): string {
    const segmento = path.split("/").filter(Boolean)[0];
    const servicio = MAPA_RUTAS[segmento];

    if (!servicio) {
      throw new NotFoundException("No hay un servicio para la ruta /" + segmento);
    }

    const url = this.config.get<string>(servicio + "_SERVICE_URL");
    if (!url) {
      throw new HttpException("El servicio " + servicio + " no esta configurado", 503);
    }
    return url;
  }

  // Reenvia cualquier peticion al servicio que corresponda
  async reenviar(
    method: string,
    path: string,
    body?: any,
    query?: any,
    res?: Response,
  ): Promise<any> {
    const baseUrl = this.resolverDestino(path);
    const url = baseUrl + "/" + path;

    try {
      const response = await firstValueFrom(
        this.http.request({ method, url, data: body, params: query }),
      );

      // Propagar la cookie si el servicio la envio (el login)
      const setCookie = response.headers["set-cookie"];
      if (setCookie && res) {
        res.setHeader("Set-Cookie", setCookie);
      }

      return response.data;
    } catch (error) {
      const axiosError = error as AxiosError;
      if (axiosError.response) {
        // Propagar el error del microservicio tal cual (mensaje y codigo)
        throw new HttpException(
          axiosError.response.data as any,
          axiosError.response.status,
        );
      }
      throw new HttpException("El servicio no responde", 503);
    }
  }
}