import { IsString, IsNotEmpty, IsNumber, IsArray, ValidateNested, Min, MaxLength, ArrayMinSize } from "class-validator";
import { Type } from "class-transformer";

// Una linea de la orden
export class LineaOrdenDto {
  @IsNumber() productoId: number;

  @IsNumber() @Min(0.001, { message: "La cantidad debe ser mayor que cero" })
  cantidad: number;

  @IsNumber() @Min(0, { message: "El costo no puede ser negativo" })
  costoUnitario: number;
}

export class CreateOrdenDto {
  @IsString() @IsNotEmpty() @MaxLength(30)
  numero: string;

  @IsNumber() proveedorId: number;
  @IsNumber() sucursalId: number;

  @IsArray()
  @ArrayMinSize(1, { message: "La orden debe tener al menos una linea" })
  @ValidateNested({ each: true })
  @Type(() => LineaOrdenDto)
  lineas: LineaOrdenDto[];
}