import { Injectable, NotFoundException, ConflictException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository, Like } from "typeorm";
import { Proveedor } from "./proveedor.entity";
import { CreateProveedorDto } from "./create-proveedor.dto";
import { UpdateProveedorDto } from "./update-proveedor.dto";

@Injectable()
export class ProveedoresService {
  constructor(
    @InjectRepository(Proveedor)
    private readonly proveedorRepo: Repository<Proveedor>,
  ) {}

  findAll(): Promise<Proveedor[]> {
    return this.proveedorRepo.find({ order: { nombre: "ASC" } });
  }

  buscar(texto: string): Promise<Proveedor[]> {
    return this.proveedorRepo.find({
      where: [
        { nombre: Like("%" + texto + "%"), activo: 1 },
        { codigo: Like("%" + texto + "%"), activo: 1 },
      ],
      order: { nombre: "ASC" },
    });
  }

  async findOne(id: number): Promise<Proveedor> {
    const proveedor = await this.proveedorRepo.findOne({ where: { proveedorId: id } });
    if (!proveedor) throw new NotFoundException("Proveedor " + id + " no encontrado");
    return proveedor;
  }

  async create(dto: CreateProveedorDto): Promise<Proveedor> {
    const existe = await this.proveedorRepo.findOne({ where: { codigo: dto.codigo } });
    if (existe) {
      throw new ConflictException("Ya existe un proveedor con el codigo " + dto.codigo);
    }
    const proveedor = this.proveedorRepo.create({
      codigo: dto.codigo,
      nombre: dto.nombre,
      nit: dto.nit ?? null,
      telefono: dto.telefono ?? null,
      activo: 1,
    });
    return this.proveedorRepo.save(proveedor);
  }

  async update(id: number, dto: UpdateProveedorDto): Promise<Proveedor> {
    const proveedor = await this.findOne(id);
    Object.assign(proveedor, dto);
    return this.proveedorRepo.save(proveedor);
  }

  // Baja logica: el proveedor tiene historial de ordenes, no se borra
  async desactivar(id: number): Promise<Proveedor> {
    const proveedor = await this.findOne(id);
    proveedor.activo = 0;
    return this.proveedorRepo.save(proveedor);
  }
}