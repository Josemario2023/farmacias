import { IsNumber, IsArray, ValidateNested, ArrayMinSize } from "class-validator";
import { Type } from "class-transformer";

// Al ENVIAR: se indica cuanto sale realmente de cada linea
export class LineaEnvioDto {
  @IsNumber() trasladoDetalleId: number;
  @IsNumber() cantEnviada: number;
}

export class EnviarTrasladoDto {
  @IsNumber() usuarioId: number;

  @IsArray() @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => LineaEnvioDto)
  lineas: LineaEnvioDto[];
}

// Al RECIBIR: se indica cuanto llego realmente
export class LineaRecepcionTrasladoDto {
  @IsNumber() trasladoDetalleId: number;
  @IsNumber() cantRecibida: number;
}

export class RecibirTrasladoDto {
  @IsNumber() usuarioId: number;

  @IsArray() @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => LineaRecepcionTrasladoDto)
  lineas: LineaRecepcionTrasladoDto[];
}