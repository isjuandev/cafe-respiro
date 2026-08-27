import { IsString, MaxLength, MinLength } from 'class-validator';

export class RegisterDto {
  @IsString()
  @MinLength(2)
  @MaxLength(80)
  nombre!: string;

  @IsString()
  @MinLength(2)
  @MaxLength(120)
  contacto!: string;

  @IsString()
  @MinLength(8)
  @MaxLength(128)
  password!: string;
}

export class UnifiedLoginDto {
  @IsString()
  @MinLength(1)
  @MaxLength(120)
  usuario!: string;

  @IsString()
  @MinLength(1)
  @MaxLength(128)
  password!: string;
}
