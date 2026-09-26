import { IsString, IsNotEmpty, IsNumber, IsOptional, IsIn, MaxLength } from "class-validator";

export class CreateSucursalDto {
  @IsNumber({}, { message: "regionId debe ser un numero" })
  regionId: number;

  @IsString()
  @IsNotEmpty({ message: "El codigo es obligatorio" })
  @MaxLength(20)
  codigo: string;

  @IsString()
  @IsNotEmpty({ message: "El nombre es obligatorio" })
  @MaxLength(120)
  nombre: string;

  @IsOptional()
  @IsIn(["SUCURSAL", "STAND"], { message: "tipo debe ser SUCURSAL o STAND" })
  tipo?: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  direccion?: string;
}