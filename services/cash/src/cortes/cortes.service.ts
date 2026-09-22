import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { CorteCaja } from "./corte-caja.entity";

// @Injectable marca esta clase como "inyectable": NestJS puede crearla
// y entregarsela a quien la necesite (inyeccion de dependencias).
@Injectable()
export class CortesService {
  constructor(
    // @InjectRepository pide a NestJS el "repositorio" de CorteCaja.
    // Un Repository es el objeto de TypeORM que sabe consultar/guardar esa tabla.
    // Equivale a inyectar un DbContext y usar su DbSet<CorteCaja>.
    @InjectRepository(CorteCaja)
    private readonly corteRepo: Repository<CorteCaja>,
  ) {}

  // Metodo de negocio: devuelve todos los cortes.
  // .find() es como _context.Cortes.ToListAsync() en EF Core.
  findAll(): Promise<CorteCaja[]> {
    return this.corteRepo.find();
  }
}
