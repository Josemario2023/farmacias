import { Injectable, NotFoundException, ConflictException, BadRequestException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { Sucursal } from "./sucursal.entity";
import { Region } from "../regiones/region.entity";
import { CreateSucursalDto } from "./create-sucursal.dto";
import { UpdateSucursalDto } from "./update-sucursal.dto";

@Injectable()
export class SucursalesService {
  constructor(
    @InjectRepository(Sucursal)
    private readonly sucursalRepo: Repository<Sucursal>,
    @InjectRepository(Region)
    private readonly regionRepo: Repository<Region>,
  ) {}

  findAll(): Promise<Sucursal[]> {
    return this.sucursalRepo.find({ order: { codigo: "ASC" } });
  }

  async findOne(id: number): Promise<Sucursal> {
    const sucursal = await this.sucursalRepo.findOne({ where: { sucursalId: id } });
    if (!sucursal) {
      throw new NotFoundException("Sucursal " + id + " no encontrada");
    }
    return sucursal;
  }

  // Listar sucursales de una region (util para el gerente regional)
  findByRegion(regionId: number): Promise<Sucursal[]> {
    return this.sucursalRepo.find({ where: { regionId }, order: { codigo: "ASC" } });
  }

  async create(dto: CreateSucursalDto): Promise<Sucursal> {
    // 1) Validar que la REGION exista (antes de que truene la FK de Oracle)
    const region = await this.regionRepo.findOne({ where: { regionId: dto.regionId } });
    if (!region) {
      throw new BadRequestException("La region " + dto.regionId + " no existe");
    }

    // 2) Validar codigo unico
    const existe = await this.sucursalRepo.findOne({ where: { codigo: dto.codigo } });
    if (existe) {
      throw new ConflictException("Ya existe una sucursal con el codigo " + dto.codigo);
    }

    const sucursal = this.sucursalRepo.create({
      regionId: dto.regionId,
      codigo: dto.codigo,
      nombre: dto.nombre,
      tipo: dto.tipo ?? "SUCURSAL",
      direccion: dto.direccion ?? null,
      activo: 1,
    });
    return this.sucursalRepo.save(sucursal);
  }

  async update(id: number, dto: UpdateSucursalDto): Promise<Sucursal> {
    const sucursal = await this.findOne(id);

    // Si cambian la region, validar que exista
    if (dto.regionId !== undefined) {
      const region = await this.regionRepo.findOne({ where: { regionId: dto.regionId } });
      if (!region) {
        throw new BadRequestException("La region " + dto.regionId + " no existe");
      }
    }

    Object.assign(sucursal, dto);
    return this.sucursalRepo.save(sucursal);
  }

  async desactivar(id: number): Promise<Sucursal> {
    const sucursal = await this.findOne(id);
    sucursal.activo = 0;
    return this.sucursalRepo.save(sucursal);
  }
}