import { IsNumber, Min } from "class-validator";

export class CreatePoliticaDto {
  @IsNumber() sucursalId: number;
  @IsNumber() productoId: number;

  @IsNumber()
  @Min(0, { message: "El stock minimo no puede ser negativo" })
  stockMinimo: number;
}
