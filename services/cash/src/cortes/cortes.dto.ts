import { IsString, IsNotEmpty, IsNumber, IsOptional, IsIn, Min, MaxLength } from "class-validator";

// Crear una caja
export class CreateCajaDto {
  @IsNumber() sucursalId: number;

  @IsString() @IsNotEmpty() @MaxLength(80)
  nombre: string;
}

// Abrir un corte (turno)
export class AbrirCorteDto {
  @IsNumber() cajaId: number;
  @IsNumber() sucursalId: number;
  @IsNumber() usuarioId: number;

  @IsString() @IsNotEmpty() @MaxLength(20)
  turno: string;

  @IsNumber() @Min(0, { message: "El fondo inicial no puede ser negativo" })
  montoApertura: number;
}

// Registrar un movimiento de caja
export class CreateMovimientoCajaDto {
  @IsNumber() corteId: number;

  @IsIn(["INGRESO", "EGRESO"], { message: "El tipo debe ser INGRESO o EGRESO" })
  tipo: string;

  @IsString() @IsNotEmpty() @MaxLength(150)
  concepto: string;

  @IsNumber() @Min(0.01, { message: "El monto debe ser mayor que cero" })
  monto: number;

  @IsOptional() @IsNumber()
  refId?: number;
}

// Cerrar el corte
export class CerrarCorteDto {
  @IsNumber() @Min(0)
  totalContado: number;

  @IsNumber() usuarioId: number;
}