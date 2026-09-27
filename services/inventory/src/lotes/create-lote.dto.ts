import { IsString, IsNotEmpty, IsNumber, IsDateString, MaxLength } from "class-validator";

export class CreateLoteDto {
  @IsNumber({}, { message: "productoId debe ser un numero" })
  productoId: number;

  @IsString()
  @IsNotEmpty({ message: "El numero de lote es obligatorio" })
  @MaxLength(50)
  numeroLote: string;

  // Formato esperado: "2027-06-30"
  @IsDateString({}, { message: "fechaVencimiento debe tener formato YYYY-MM-DD" })
  fechaVencimiento: string;
}