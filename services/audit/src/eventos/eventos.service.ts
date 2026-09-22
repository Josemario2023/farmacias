import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { Evento } from "./evento.entity";

@Injectable()
export class EventosService {
  constructor(
    @InjectRepository(Evento)
    private readonly eventoRepo: Repository<Evento>,
  ) {}

  findAll(): Promise<Evento[]> {
    return this.eventoRepo.find();
  }
}
