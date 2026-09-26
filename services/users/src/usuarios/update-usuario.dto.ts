import { IsString, IsOptional, IsIn, MinLength, MaxLength } from "class-validator";

// Valida los datos para EDITAR un usuario (todo opcional)
export class UpdateUsuarioDto {
  @IsOptional()
  @IsString()
  @MaxLength(120)
  nombre?: string;

  // Si viene, se hashea y reemplaza la contrasena
  @IsOptional()
  @IsString()
  @MinLength(6, { message: "La contrasena debe tener al menos 6 caracteres" })
  password?: string;

  @IsOptional()
  @IsIn([0, 1], { message: "activo debe ser 0 o 1" })
  activo?: number;
}