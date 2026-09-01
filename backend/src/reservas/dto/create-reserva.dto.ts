import {
  IsArray,
  IsBoolean,
  IsEmail,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  MinLength,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export class ItemEntradaDto {
  @IsString()
  @IsNotEmpty({ message: 'El id del tipo de entrada es obligatorio' })
  tipoEntradaId!: string;

  @Type(() => Number)
  @IsInt({ message: 'La cantidad debe ser un entero' })
  @Min(1, { message: 'La cantidad mínima por item es 1' })
  @Max(10, { message: 'La cantidad máxima por tipo es 10' })
  cantidad!: number;
}

export class CreateReservaDto {
  @IsOptional()
  @IsString()
  @MinLength(2, { message: 'El nombre debe tener al menos 2 caracteres' })
  @MaxLength(80, { message: 'El nombre no puede exceder 80 caracteres' })
  nombre?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100, { message: 'El contacto no puede exceder 100 caracteres' })
  contacto?: string;

  @IsOptional()
  @IsEmail({}, { message: 'El correo electrónico no es válido' })
  @MaxLength(120, { message: 'El correo no puede exceder 120 caracteres' })
  email?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'La cantidad debe ser un número entero' })
  @Min(1, { message: 'Mínimo 1 entrada' })
  @Max(16, { message: 'Máximo 16 entradas' })
  cantidad?: number;

  @IsOptional()
  @IsArray({ message: 'Los items deben ser un arreglo' })
  @ValidateNested({ each: true })
  @Type(() => ItemEntradaDto)
  items?: ItemEntradaDto[];

  @IsOptional()
  @IsBoolean()
  aceptoTerminos?: boolean;
}
