import { IsString, MaxLength, MinLength } from 'class-validator';

export class CreateVotoDto {
  @IsString()
  @MinLength(2, { message: 'El nombre debe tener al menos 2 caracteres' })
  @MaxLength(60, { message: 'El nombre no puede exceder 60 caracteres' })
  nombre!: string;

  @IsString()
  @MinLength(2, { message: 'El contacto es obligatorio' })
  @MaxLength(100, { message: 'El contacto no puede exceder 100 caracteres' })
  contacto!: string;
}
