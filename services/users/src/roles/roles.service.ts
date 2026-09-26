import { Injectable, NotFoundException, ConflictException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { Rol } from "./rol.entity";
import { CreateRolDto } from "./create-rol-dto";

@Injectable()
export class RolesService {
  constructor(
    @InjectRepository(Rol)
    private readonly rolRepo: Repository<Rol>,
  ) {}

  findAll(): Promise<Rol[]> {
    return this.rolRepo.find({ order: { codigo: "ASC" } });
  }

  async findOne(id: number): Promise<Rol> {
    const rol = await this.rolRepo.findOne({ where: { rolId: id } });
    if (!rol) {
      throw new NotFoundException("Rol " + id + " no encontrado");
    }
    return rol;
  }

  async create(dto: CreateRolDto): Promise<Rol> {
    const existe = await this.rolRepo.findOne({ where: { codigo: dto.codigo } });
    if (existe) {
      throw new ConflictException("Ya existe el rol " + dto.codigo);
    }
    const rol = this.rolRepo.create({ codigo: dto.codigo, nombre: dto.nombre });
    return this.rolRepo.save(rol);
  }

  async update(id: number, dto: CreateRolDto): Promise<Rol> {
    const rol = await this.findOne(id);
    rol.codigo = dto.codigo;
    rol.nombre = dto.nombre;
    return this.rolRepo.save(rol);
  }

  // ROL no tiene campo "activo", asi que aqui el delete es real.
  // OJO: si el rol esta asignado a usuarios, Oracle lo impedira por la FK.
  async remove(id: number): Promise<{ mensaje: string }> {
    const rol = await this.findOne(id);
    await this.rolRepo.remove(rol);
    return { mensaje: "Rol eliminado" };
  }
}