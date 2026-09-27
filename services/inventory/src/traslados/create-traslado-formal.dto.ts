import { IsString, IsNotEmpty, IsNumber, IsArray, ValidateNested, Min, MaxLength, ArrayMinSize } from "class-validator";
import { Type } from "class-transformer";

export class LineaTrasladoDto {
  @IsNumber() productoId: number;
  @IsNumber() loteId: number;

  @IsNumber() @Min(0.001, { message: "La cantidad debe ser mayor que cero" })
  cantSolicitada: number;
}

export class CreateTrasladoFormalDto {
  @IsString() @IsNotEmpty() @MaxLength(30)
  numero: string;

  @IsNumber() sucursalOrigenId: number;
  @IsNumber() sucursalDestinoId: number;
  @IsNumber() solicitadoPor: number;

  @IsArray()
  @ArrayMinSize(1, { message: "El traslado debe tener al menos una linea" })
  @ValidateNested({ each: true })
  @Type(() => LineaTrasladoDto)
  lineas: LineaTrasladoDto[];
}