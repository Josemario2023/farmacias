import { IsString, IsNotEmpty, MaxLength } from "class-validator";

export class CreateRegionDto {
  @IsString()
  @IsNotEmpty({ message: "El codigo es obligatorio" })
  @MaxLength(20)
  codigo: string;

  @IsString()
  @IsNotEmpty({ message: "El nombre es obligatorio" })
  @MaxLength(100)
  nombre: string;
}