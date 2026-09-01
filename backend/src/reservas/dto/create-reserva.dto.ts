import { IsInt, Min, Max, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateReservaDto {
  @IsOptional()
  @IsString()
  @MinLength(2, { message: 'El nombre debe tener al menos 2 caracteres' })
  @MaxLength(60, { message: 'El nombre no puede exceder 60 caracteres' })
  nombre?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100, { message: 'El contacto no puede exceder 100 caracteres' })
  contacto?: string;

  @Type(() => Number)
  @IsInt({ message: 'La cantidad debe ser un número entero' })
  @Min(1, { message: 'Mínimo 1 persona' })
  @Max(10, { message: 'Máximo 10 personas por reserva' })
  cantidad!: number;
}
