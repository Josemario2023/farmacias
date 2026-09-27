import { Injectable, NotFoundException, ConflictException, BadRequestException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository, Like } from "typeorm";
import { Producto } from "./producto.entity";
import { Categoria } from "../categorias/categoria.entity";
import { CreateProductoDto } from "./create-producto.dto";
import { UpdateProductoDto } from "./update-producto.dto";

@Injectable()
export class ProductosService {
  constructor(
    @InjectRepository(Producto)
    private readonly productoRepo: Repository<Producto>,
    @InjectRepository(Categoria)
    private readonly categoriaRepo: Repository<Categoria>,
  ) {}

  // LISTAR todos
  findAll(): Promise<Producto[]> {
    return this.productoRepo.find({ order: { nombre: "ASC" } });
  }

  // BUSCAR por nombre o codigo (lo usara el POS)
  buscar(texto: string): Promise<Producto[]> {
    return this.productoRepo.find({
      where: [
        { nombre: Like("%" + texto + "%"), activo: 1 },
        { codigo: Like("%" + texto + "%"), activo: 1 },
      ],
      order: { nombre: "ASC" },
    });
  }

  // VER uno (404 si no existe)
  async findOne(id: number): Promise<Producto> {
    const producto = await this.productoRepo.findOne({ where: { productoId: id } });
    if (!producto) {
      throw new NotFoundException("Producto " + id + " no encontrado");
    }
    return producto;
  }

  // CREAR (valida categoria existente y codigo unico)
  async create(dto: CreateProductoDto): Promise<Producto> {
    const categoria = await this.categoriaRepo.findOne({ where: { categoriaId: dto.categoriaId } });
    if (!categoria) {
      throw new BadRequestException("La categoria " + dto.categoriaId + " no existe");
    }

    const existe = await this.productoRepo.findOne({ where: { codigo: dto.codigo } });
    if (existe) {
      throw new ConflictException("Ya existe un producto con el codigo " + dto.codigo);
    }

    const producto = this.productoRepo.create({
      codigo: dto.codigo,
      nombre: dto.nombre,
      categoriaId: dto.categoriaId,
      precioBase: dto.precioBase,
      requiereReceta: dto.requiereReceta ?? 0,
      activo: 1,
    });
    return this.productoRepo.save(producto);
  }

  // EDITAR
  async update(id: number, dto: UpdateProductoDto): Promise<Producto> {
    const producto = await this.findOne(id);

    if (dto.categoriaId !== undefined) {
      const categoria = await this.categoriaRepo.findOne({ where: { categoriaId: dto.categoriaId } });
      if (!categoria) {
        throw new BadRequestException("La categoria " + dto.categoriaId + " no existe");
      }
    }

    Object.assign(producto, dto);
    return this.productoRepo.save(producto);
  }

  // DESACTIVAR (baja logica: tiene historial en el kardex, no se borra)
  async desactivar(id: number): Promise<Producto> {
    const producto = await this.findOne(id);
    producto.activo = 0;
    return this.productoRepo.save(producto);
  }
}