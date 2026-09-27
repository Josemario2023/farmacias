import { IsString, IsNotEmpty, IsNumber, IsOptional, IsIn, Min, MaxLength } from "class-validator";

// Los 11 tipos validos de movimiento
const TIPOS = [
  "INVENTARIO_INICIAL","COMPRA","DEVOLUCION_CLIENTE","AJUSTE_POSITIVO","TRASLADO_ENTRADA",
  "VENTA","DEVOLUCION_PROVEEDOR","AJUSTE_NEGATIVO","MERMA","PRODUCTO_VENCIDO","TRASLADO_SALIDA",
];

export class CreateMovimientoDto {
  @IsNumber() sucursalId: number;
  @IsNumber() productoId: number;
  @IsNumber() loteId: number;

  @IsIn(TIPOS, { message: "Tipo de movimiento invalido" })
  tipoMovimiento: string;

  @IsNumber()
  @Min(0.001, { message: "La cantidad debe ser mayor que cero" })
  cantidad: number;

  @IsNumber() usuarioId: number;

  @IsOptional() @IsString() @MaxLength(50)
  documentoRef?: string;

  @IsOptional() @IsString() @MaxLength(300)
  observaciones?: string;
}