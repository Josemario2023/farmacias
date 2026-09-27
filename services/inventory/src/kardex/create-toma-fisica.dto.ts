import { IsString, IsNumber, IsOptional, Min, MaxLength } from "class-validator";

export class CreateTomaFisicaDto {
  @IsNumber() sucursalId: number;
  @IsNumber() productoId: number;
  @IsNumber() loteId: number;

  @IsNumber() @Min(0, { message: "La cantidad contada no puede ser negativa" })
  cantidadContada: number;

  @IsNumber() usuarioId: number;

  @IsString() @MaxLength(50)
  documentoRef: string;

  @IsOptional() @IsString() @MaxLength(300)
  observaciones?: string;
}