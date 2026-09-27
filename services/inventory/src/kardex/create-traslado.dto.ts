import { IsString, IsNumber, IsOptional, Min, MaxLength } from "class-validator";

export class CreateTrasladoDto {
  @IsNumber() sucursalOrigen: number;
  @IsNumber() sucursalDestino: number;
  @IsNumber() productoId: number;
  @IsNumber() loteId: number;

  @IsNumber() @Min(0.001)
  cantidad: number;

  @IsNumber() usuarioId: number;

  @IsString() @MaxLength(50)
  documentoRef: string;

  @IsOptional() @IsString() @MaxLength(300)
  observaciones?: string;
}