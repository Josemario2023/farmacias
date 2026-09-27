import { IsString, IsNotEmpty, IsNumber, IsOptional, IsIn, Min, MaxLength } from "class-validator";

export class CreateProductoDto {
  @IsString()
  @IsNotEmpty({ message: "El codigo es obligatorio" })
  @MaxLength(30)
  codigo: string;

  @IsString()
  @IsNotEmpty({ message: "El nombre es obligatorio" })
  @MaxLength(150)
  nombre: string;

  @IsNumber({}, { message: "categoriaId debe ser un numero" })
  categoriaId: number;

  @IsNumber({}, { message: "precioBase debe ser un numero" })
  @Min(0, { message: "El precio no puede ser negativo" })
  precioBase: number;

  @IsOptional()
  @IsIn([0, 1], { message: "requiereReceta debe ser 0 o 1" })
  requiereReceta?: number;
}