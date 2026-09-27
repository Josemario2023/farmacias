import { IsString, IsNotEmpty, IsOptional, MaxLength } from "class-validator";

export class CreateProveedorDto {
  @IsString() @IsNotEmpty({ message: "El codigo es obligatorio" }) @MaxLength(30)
  codigo: string;

  @IsString() @IsNotEmpty({ message: "El nombre es obligatorio" }) @MaxLength(150)
  nombre: string;

  @IsOptional() @IsString() @MaxLength(20)
  nit?: string;

  @IsOptional() @IsString() @MaxLength(30)
  telefono?: string;
}