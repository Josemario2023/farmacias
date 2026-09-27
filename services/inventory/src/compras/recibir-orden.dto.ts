import { IsNumber, IsArray, ValidateNested, IsString, MaxLength, ArrayMinSize } from "class-validator";
import { Type } from "class-transformer";

// Cada linea recibida indica a que LOTE entra
export class LineaRecepcionDto {
  @IsNumber() productoId: number;
  @IsNumber() loteId: number;
  @IsNumber() cantidad: number;
}

export class RecibirOrdenDto {
  @IsNumber() usuarioId: number;

  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => LineaRecepcionDto)
  lineas: LineaRecepcionDto[];
}