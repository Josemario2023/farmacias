import { IsString, IsNotEmpty, MinLength } from "class-validator";

// Define y valida los datos para crear un usuario.
// Como los [Required]/[MinLength] de ASP.NET.
export class CreateUsuarioDto {
  @IsString()
  @IsNotEmpty()
  username: string;

  @IsString()
  @MinLength(6)   // la contrasena debe tener al menos 6 caracteres
  password: string;

  @IsString()
  @IsNotEmpty()
  nombre: string;
}
