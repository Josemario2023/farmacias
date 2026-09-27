import { IsString, IsNumber, IsOptional, IsIn, Min, MaxLength } from "class-validator";

export class UpdateProductoDto {
  @IsOptional()
  @IsString()
  @MaxLength(150)
  nombre?: string;

  @IsOptional()
  @IsNumber()
  categoriaId?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  precioBase?: number;

  @IsOptional()
  @IsIn([0, 1])
  requiereReceta?: number;

  @IsOptional()
  @IsIn([0, 1])
  activo?: number;
}