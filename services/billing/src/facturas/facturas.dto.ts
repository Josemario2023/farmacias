import { IsString, IsNotEmpty, IsNumber, IsOptional, IsArray, ValidateNested, Min, MaxLength, ArrayMinSize } from "class-validator";
import { Type } from "class-transformer";

// Crear una serie de facturacion
export class CreateSerieDto {
  @IsNumber() sucursalId: number;

  @IsString() @IsNotEmpty() @MaxLength(20)
  serie: string;
}

// Una linea de la factura
export class LineaFacturaDto {
  @IsNumber() productoId: number;

  @IsString() @IsNotEmpty() @MaxLength(200)
  descripcion: string;

  @IsNumber() @Min(0.001)
  cantidad: number;

  @IsNumber() @Min(0)
  precioUnitario: number;

  @IsOptional() @IsNumber() @Min(0)
  impuesto?: number;
}

// Emitir una factura
export class EmitirFacturaDto {
  @IsNumber() serieId: number;
  @IsNumber() sucursalId: number;

  @IsOptional() @IsNumber()
  ventaId?: number;

  @IsOptional() @IsNumber()
  clienteId?: number;

  @IsArray()
  @ArrayMinSize(1, { message: "La factura debe tener al menos una linea" })
  @ValidateNested({ each: true })
  @Type(() => LineaFacturaDto)
  lineas: LineaFacturaDto[];
}