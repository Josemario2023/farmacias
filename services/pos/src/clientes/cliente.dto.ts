import { IsString, IsNotEmpty, IsOptional, MaxLength } from "class-validator";

export class CreateClienteDto {
  @IsString() @IsNotEmpty() @MaxLength(150)
  nombre: string;

  @IsString() @IsNotEmpty() @MaxLength(30)
  identificacion: string;   // NIT

  @IsString() @IsNotEmpty() @MaxLength(250)
  direccion: string;

  @IsOptional() @IsString() @MaxLength(30)
  telefono?: string;
}