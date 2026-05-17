import { IsOptional, IsString, Matches, MaxLength, MinLength } from "class-validator";

export class TestNetgsmSmsDto {
  @IsString()
  @Matches(/^(\+?90)?[\s-]?0?5\d{2}[\s-]?\d{3}[\s-]?\d{2}[\s-]?\d{2}$/, {
    message: "Telefon TR cep formatında olmalı",
  })
  phone!: string;

  @IsOptional()
  @IsString()
  @MinLength(4)
  @MaxLength(500)
  message?: string;
}
