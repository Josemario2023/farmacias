import { IsString, IsNotEmpty, IsOptional, MaxLength } from "class-validator";

export class CreatePermisoDto {
  @IsString()
  @IsNotEmpty({ message: "El codigo es obligatorio" })
  @MaxLength(50)
  codigo: string;

  @IsOptional()
  @IsString()
  @MaxLength(150)
  descripcion?: string;
}