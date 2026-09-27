import { Injectable, NotFoundException, ConflictException, BadRequestException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { Categoria } from "./categoria.entity";
import { Producto } from "../productos/producto.entity";
import { CreateCategoriaDto } from "./create-categoria.dto";

@Injectable()
export class CategoriasService {
  constructor(
    @InjectRepository(Categoria)
    private readonly categoriaRepo: Repository<Categoria>,
    @InjectRepository(Producto)
    private readonly productoRepo: Repository<Producto>,
  ) {}

  findAll(): Promise<Categoria[]> {
    return this.categoriaRepo.find({ order: { nombre: "ASC" } });
  }

  async findOne(id: number): Promise<Categoria> {
    const categoria = await this.categoriaRepo.findOne({ where: { categoriaId: id } });
    if (!categoria) {
      throw new NotFoundException("Categoria " + id + " no encontrada");
    }
    return categoria;
  }

  async create(dto: CreateCategoriaDto): Promise<Categoria> {
    const existe = await this.categoriaRepo.findOne({ where: { nombre: dto.nombre } });
    if (existe) {
      throw new ConflictException("Ya existe la categoria " + dto.nombre);
    }
    const categoria = this.categoriaRepo.create({ nombre: dto.nombre });
    return this.categoriaRepo.save(categoria);
  }

  async update(id: number, dto: CreateCategoriaDto): Promise<Categoria> {
    const categoria = await this.findOne(id);
    categoria.nombre = dto.nombre;
    return this.categoriaRepo.save(categoria);
  }

  // BORRAR: solo si NO tiene productos (protege la integridad referencial)
  async remove(id: number): Promise<{ mensaje: string }> {
    const categoria = await this.findOne(id);

    const cuantos = await this.productoRepo.count({ where: { categoriaId: id } });
    if (cuantos > 0) {
      throw new BadRequestException(
        "No se puede borrar: hay " + cuantos + " producto(s) en esta categoria",
      );
    }

    await this.categoriaRepo.remove(categoria);
    return { mensaje: "Categoria eliminada" };
  }
}