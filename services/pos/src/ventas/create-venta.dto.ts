import { IsString, IsNotEmpty, IsNumber, IsOptional, IsArray, IsIn, ValidateNested, Min, MaxLength, ArrayMinSize } from "class-validator";
import { Type } from "class-transformer";

// Una linea de la venta (que producto, de que lote, cuanto)
export class LineaVentaDto {
  @IsNumber() productoId: number;
  @IsNumber() loteId: number;          // OBLIGATORIO: tu regla "las ventas deben registrar el lote"

  @IsString() @IsNotEmpty() @MaxLength(200)
  descripcion: string;

  @IsNumber() @Min(0.001, { message: "La cantidad debe ser mayor que cero" })
  cantidad: number;

  @IsNumber() @Min(0)
  precioUnitario: number;
}

// Una forma de pago (una venta puede tener varias)
export class PagoVentaDto {
  @IsIn(["EFECTIVO", "TARJETA", "TRANSFERENCIA"], { message: "Forma de pago invalida" })
  formaPago: string;

  @IsNumber() @Min(0)
  monto: number;

  @IsOptional() @IsString() @MaxLength(50)
  referencia?: string;
}

export class CreateVentaDto {
  @IsString() @IsNotEmpty() @MaxLength(30)
  numero: string;

  @IsNumber() sucursalId: number;
  @IsNumber() usuarioId: number;

  @IsOptional() @IsNumber()
  regionId?: number;

  @IsOptional() @IsNumber()
  clienteId?: number;

  @IsOptional() @IsNumber()
  corteId?: number;

  @IsArray()
  @ArrayMinSize(1, { message: "La venta debe tener al menos un producto" })
  @ValidateNested({ each: true })
  @Type(() => LineaVentaDto)
  lineas: LineaVentaDto[];

  @IsArray()
  @ArrayMinSize(1, { message: "La venta debe tener al menos una forma de pago" })
  @ValidateNested({ each: true })
  @Type(() => PagoVentaDto)
  pagos: PagoVentaDto[];
}