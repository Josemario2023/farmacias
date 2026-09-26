import { Injectable, NotFoundException, ConflictException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { Permiso } from "./permiso.entity";
import { CreatePermisoDto } from "./create-permiso.dto";

@Injectable()
export class PermisosService {
  constructor(
    @InjectRepository(Permiso)
    private readonly permisoRepo: Repository<Permiso>,
  ) {}

  findAll(): Promise<Permiso[]> {
    return this.permisoRepo.find({ order: { codigo: "ASC" } });
  }

  async findOne(id: number): Promise<Permiso> {
    const permiso = await this.permisoRepo.findOne({ where: { permisoId: id } });
    if (!permiso) {
      throw new NotFoundException("Permiso " + id + " no encontrado");
    }
    return permiso;
  }

  async create(dto: CreatePermisoDto): Promise<Permiso> {
    const existe = await this.permisoRepo.findOne({ where: { codigo: dto.codigo } });
    if (existe) {
      throw new ConflictException("Ya existe el permiso " + dto.codigo);
    }
    const permiso = this.permisoRepo.create({
      codigo: dto.codigo,
      descripcion: dto.descripcion ?? null,
    });
    return this.permisoRepo.save(permiso);
  }

  async update(id: number, dto: CreatePermisoDto): Promise<Permiso> {
    const permiso = await this.findOne(id);
    permiso.codigo = dto.codigo;
    permiso.descripcion = dto.descripcion ?? null;
    return this.permisoRepo.save(permiso);
  }

  async remove(id: number): Promise<{ mensaje: string }> {
    const permiso = await this.findOne(id);
    await this.permisoRepo.remove(permiso);
    return { mensaje: "Permiso eliminado" };
  }
}