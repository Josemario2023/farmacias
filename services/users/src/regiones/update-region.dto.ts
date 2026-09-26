import { IsString, IsOptional, IsIn, MaxLength } from "class-validator";

export class UpdateRegionDto {
  @IsOptional()
  @IsString()
  @MaxLength(100)
  nombre?: string;

  @IsOptional()
  @IsIn([0, 1], { message: "activo debe ser 0 o 1" })
  activo?: number;
}