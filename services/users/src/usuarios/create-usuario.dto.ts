import { IsString, IsNotEmpty, MinLength, IsEmail, MaxLength } from "class-validator";

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

  @IsEmail({}, { message: "El correo no tiene un formato valido" })
  @MaxLength(200)
  correo: string;
}
