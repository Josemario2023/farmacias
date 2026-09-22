import { Controller, Get, Post, Inject } from "@nestjs/common";
import { ClientProxy } from "@nestjs/microservices";
import { AppService } from "./app.service";

@Controller()
export class AppController {
  constructor(
    private readonly appService: AppService,
    @Inject("RABBITMQ_CLIENT") private readonly client: ClientProxy,
  ) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @Post("ping")
  enviarPing() {
    const mensaje = { texto: "Hola desde users!", fecha: new Date().toISOString() };
    this.client.emit("test.ping", mensaje);
    return { publicado: true, mensaje };
  }
}