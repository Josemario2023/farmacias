import { Injectable, HttpException } from "@nestjs/common";
import { HttpService } from "@nestjs/axios";
import { ConfigService } from "@nestjs/config";
import { firstValueFrom } from "rxjs";
import { AxiosError } from "axios";
import type { Response } from "express";

@Injectable()
export class ProxyService {
  constructor(
    private readonly http: HttpService,
    private readonly config: ConfigService,
  ) {}

  // Reenvia una peticion a users. Si "res" viene, reenvia tambien las cookies.
  async forwardToUsers(
    method: string,
    path: string,
    body?: any,
    res?: Response,
  ): Promise<any> {
    const baseUrl = this.config.get<string>("USERS_SERVICE_URL");
    const url = baseUrl + path;

    try {
      const response = await firstValueFrom(
        this.http.request({ method, url, data: body }),
      );

      // Si users devolvio un Set-Cookie, lo reenviamos al navegador
      const setCookie = response.headers["set-cookie"];
      if (setCookie && res) {
        res.setHeader("Set-Cookie", setCookie);
      }

      return response.data;
    } catch (error) {
      const axiosError = error as AxiosError;
      if (axiosError.response) {
        throw new HttpException(
          axiosError.response.data as any,
          axiosError.response.status,
        );
      }
      throw new HttpException("El servicio users no responde", 503);
    }
  }
}