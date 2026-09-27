import { IsString, IsNotEmpty, MaxLength } from "class-validator";

// Valida los datos para crear/editar una categoria
export class CreateCategoriaDto {
  @IsString()
  @IsNotEmpty({ message: "El nombre es obligatorio" })
  @MaxLength(100)
  nombre: string;
}