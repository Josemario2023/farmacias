import { IsString, IsNumber, IsOptional, IsIn, MaxLength } from "class-validator";

export class UpdateSucursalDto {
  @IsOptional()
  @IsNumber()
  regionId?: number;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  nombre?: string;

  @IsOptional()
  @IsIn(["SUCURSAL", "STAND"])
  tipo?: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  direccion?: string;

  @IsOptional()
  @IsIn([0, 1])
  activo?: number;
}