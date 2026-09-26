import { Injectable, NotFoundException, ConflictException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { Region } from "./region.entity";
import { CreateRegionDto } from "./create-region.dto";
import { UpdateRegionDto } from "./update-region.dto";

@Injectable()
export class RegionesService {
  constructor(
    @InjectRepository(Region)
    private readonly regionRepo: Repository<Region>,
  ) {}

  // LISTAR todas (ordenadas por codigo)
  findAll(): Promise<Region[]> {
    return this.regionRepo.find({ order: { codigo: "ASC" } });
  }

  // VER una por id (404 si no existe)
  async findOne(id: number): Promise<Region> {
    const region = await this.regionRepo.findOne({ where: { regionId: id } });
    if (!region) {
      throw new NotFoundException("Region " + id + " no encontrada");
    }
    return region;
  }

  // CREAR (valida codigo unico ANTES de guardar)
  async create(dto: CreateRegionDto): Promise<Region> {
    const existe = await this.regionRepo.findOne({ where: { codigo: dto.codigo } });
    if (existe) {
      throw new ConflictException("Ya existe una region con el codigo " + dto.codigo);
    }
    const region = this.regionRepo.create({
      codigo: dto.codigo,
      nombre: dto.nombre,
      activo: 1,
    });
    return this.regionRepo.save(region);
  }

  // EDITAR (aplica solo los campos que vengan)
  async update(id: number, dto: UpdateRegionDto): Promise<Region> {
    const region = await this.findOne(id);
    Object.assign(region, dto);
    return this.regionRepo.save(region);
  }

  // DESACTIVAR (baja logica: activo = 0, NO se borra)
  async desactivar(id: number): Promise<Region> {
    const region = await this.findOne(id);
    region.activo = 0;
    return this.regionRepo.save(region);
  }
}