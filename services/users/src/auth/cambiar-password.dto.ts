import { IsString, MinLength, MaxLength, Matches } from "class-validator";

export class CambiarPasswordDto {
  @IsString()
  @MaxLength(100)
  passwordActual: string;

  @IsString()
  @MinLength(8, { message: "La contraseña nueva debe tener al menos 8 caracteres" })
  @MaxLength(100)
  @Matches(/^(?=.*[A-Za-z])(?=.*\d).+$/, { message: "La contraseña nueva debe incluir letras y números" })
  passwordNueva: string;
}