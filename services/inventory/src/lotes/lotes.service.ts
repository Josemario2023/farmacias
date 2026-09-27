import { Injectable, NotFoundException, ConflictException, BadRequestException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository, LessThanOrEqual } from "typeorm";
import { Lote } from "./lote.entity";
import { Producto } from "../productos/producto.entity";
import { CreateLoteDto } from "./create-lote.dto";

@Injectable()
export class LotesService {
  constructor(
    @InjectRepository(Lote)
    private readonly loteRepo: Repository<Lote>,
    @InjectRepository(Producto)
    private readonly productoRepo: Repository<Producto>,
  ) {}

  // LISTAR todos (los mas proximos a vencer primero)
  findAll(): Promise<Lote[]> {
    return this.loteRepo.find({ order: { fechaVencimiento: "ASC" } });
  }

  // LOTES de un producto (para elegir de cual vender)
  findByProducto(productoId: number): Promise<Lote[]> {
    return this.loteRepo.find({
      where: { productoId },
      order: { fechaVencimiento: "ASC" },   // FIFO: vender primero el que vence antes
    });
  }

  async findOne(id: number): Promise<Lote> {
    const lote = await this.loteRepo.findOne({ where: { loteId: id } });
    if (!lote) {
      throw new NotFoundException("Lote " + id + " no encontrado");
    }
    return lote;
  }

  // ALERTA: lotes que vencen dentro de N dias (default 60)
  async porVencer(dias: number = 60): Promise<Lote[]> {
    const limite = new Date();
    limite.setDate(limite.getDate() + dias);
    return this.loteRepo.find({
      where: { fechaVencimiento: LessThanOrEqual(limite) },
      order: { fechaVencimiento: "ASC" },
    });
  }

  async create(dto: CreateLoteDto): Promise<Lote> {
    // 1) Validar que el producto exista
    const producto = await this.productoRepo.findOne({ where: { productoId: dto.productoId } });
    if (!producto) {
      throw new BadRequestException("El producto " + dto.productoId + " no existe");
    }

    // 2) Validar que no exista ya ese numero de lote para ese producto
    const existe = await this.loteRepo.findOne({
      where: { productoId: dto.productoId, numeroLote: dto.numeroLote },
    });
    if (existe) {
      throw new ConflictException(
        "El lote " + dto.numeroLote + " ya existe para ese producto",
      );
    }

    const lote = this.loteRepo.create({
      productoId: dto.productoId,
      numeroLote: dto.numeroLote,
      fechaVencimiento: new Date(dto.fechaVencimiento),
    });
    return this.loteRepo.save(lote);
  }
}