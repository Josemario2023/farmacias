import { IsString, IsNotEmpty, MaxLength } from "class-validator";

export class CreateRolDto {
  @IsString()
  @IsNotEmpty({ message: "El codigo es obligatorio" })
  @MaxLength(30)
  codigo: string;

  @IsString()
  @IsNotEmpty({ message: "El nombre es obligatorio" })
  @MaxLength(80)
  nombre: string;
}