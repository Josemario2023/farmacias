import { IsString, IsOptional, IsIn, MaxLength } from "class-validator";

export class UpdateProveedorDto {
  @IsOptional() @IsString() @MaxLength(150)
  nombre?: string;

  @IsOptional() @IsString() @MaxLength(20)
  nit?: string;

  @IsOptional() @IsString() @MaxLength(30)
  telefono?: string;

  @IsOptional() @IsIn([0, 1])
  activo?: number;
}