import { Controller, Post, Get } from "@nestjs/common";
import { SyncService } from "./sync.service";

@Controller("sync")
export class SyncController {
  constructor(private readonly syncService: SyncService) {}

  // POST /sync -> dispara la sincronizacion Oracle -> SQL Server
  @Post()
  sincronizar() {
    return this.syncService.sincronizar();
  }

  // GET /sync -> tambien permite dispararla desde el navegador (comodo para probar)
  @Get()
  sincronizarGet() {
    return this.syncService.sincronizar();
  }
}