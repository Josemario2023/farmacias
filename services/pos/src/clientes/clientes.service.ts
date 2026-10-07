import { Injectable, ConflictException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { Cliente } from "../ventas/cliente.entity";
import { CreateClienteDto } from "./cliente.dto";

@Injectable()
export class ClientesService {
  constructor(
    @InjectRepository(Cliente) private readonly repo: Repository<Cliente>,
  ) {}

  // Sin parámetro: lista todos. Con ?nit=: busca ese NIT exacto.
  buscar(nit?: string): Promise<Cliente[]> {
    if (nit) {
      return this.repo.find({ where: { identificacion: nit.trim().toUpperCase() } });
    }
    return this.repo.find({ order: { nombre: "ASC" } });
  }

  async crear(dto: CreateClienteDto): Promise<Cliente> {
    const nit = dto.identificacion.trim().toUpperCase();
    const existe = await this.repo.findOne({ where: { identificacion: nit } });
    if (existe) {
      throw new ConflictException("Ya existe un cliente con el NIT " + nit);
    }
    const cliente = this.repo.create({
      nombre: dto.nombre.trim(),
      identificacion: nit,
      direccion: dto.direccion.trim(),
      telefono: dto.telefono?.trim() || null,
    });
    return this.repo.save(cliente);
  }
}