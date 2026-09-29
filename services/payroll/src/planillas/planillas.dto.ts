import { IsString, IsNotEmpty, IsNumber, IsOptional, IsIn, Min, MaxLength } from "class-validator";

export class CreateEmpleadoDto {
  @IsString() @IsNotEmpty() @MaxLength(30)
  codigo: string;

  @IsString() @IsNotEmpty() @MaxLength(150)
  nombre: string;

  @IsOptional() @IsString() @MaxLength(80)
  puesto?: string;

  @IsNumber() sucursalId: number;

  @IsOptional() @IsNumber()
  usuarioId?: number;
}

export class CreatePlanillaDto {
  @IsString() @IsNotEmpty() @MaxLength(20)
  periodo: string;

  @IsNumber() sucursalId: number;
}

export class CreatePagoDto {
  @IsNumber() planillaId: number;
  @IsNumber() empleadoId: number;

  @IsIn(["SALARIO", "BONO", "OTRO"], { message: "tipo debe ser SALARIO, BONO u OTRO" })
  tipo: string;

  @IsNumber() @Min(0, { message: "El monto no puede ser negativo" })
  montoPagado: number;
}