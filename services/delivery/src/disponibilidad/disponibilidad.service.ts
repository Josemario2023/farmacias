import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { Disponibilidad } from "./disponibilidad.entity";

@Injectable()
export class DisponibilidadService {
  constructor(
    @InjectRepository(Disponibilidad)
    private readonly dispRepo: Repository<Disponibilidad>,
  ) {}

  findAll(): Promise<Disponibilidad[]> {
    return this.dispRepo.find();
  }
}
