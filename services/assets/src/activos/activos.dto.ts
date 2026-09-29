import { IsString, IsNotEmpty, IsNumber, IsOptional, IsIn, IsDateString, Min, MaxLength } from "class-validator";

export class CreateCategoriaActivoDto {
  @IsString() @IsNotEmpty() @MaxLength(100)
  nombre: string;

  @IsNumber() @Min(1, { message: "La vida util debe ser mayor que cero" })
  vidaUtilMeses: number;

  @IsIn(["LINEA_RECTA", "SALDO_DECRECIENTE"], {
    message: "metodoDepreciacion debe ser LINEA_RECTA o SALDO_DECRECIENTE",
  })
  metodoDepreciacion: string;

  @IsOptional() @IsNumber() @Min(0)
  tasaAnual?: number;
}

export class CreateActivoDto {
  @IsString() @IsNotEmpty() @MaxLength(30)
  codigo: string;

  @IsString() @IsNotEmpty() @MaxLength(150)
  nombre: string;

  @IsNumber() categoriaActivoId: number;
  @IsNumber() sucursalId: number;

  @IsNumber() @Min(0, { message: "El valor no puede ser negativo" })
  valorAdquisicion: number;

  @IsDateString({}, { message: "fechaAdquisicion debe tener formato YYYY-MM-DD" })
  fechaAdquisicion: string;
}

export class CalcularDepreciacionDto {
  // Periodo a calcular, ej. "2026-09"
  @IsString() @IsNotEmpty() @MaxLength(20)
  periodo: string;

  @IsOptional() @IsNumber()
  sucursalId?: number;
}