import { IsBoolean, IsInt, IsOptional, IsString, Max, MaxLength, Min, MinLength } from 'class-validator';

export class CreateItemMenuDto {
  @IsString()
  categoriaId!: string;

  @IsString()
  @MinLength(2)
  @MaxLength(120)
  nombre!: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  descripcion?: string;

  @IsInt()
  @Min(0)
  precio!: number;

  @IsOptional()
  @IsString()
  imagenUrl?: string;

  @IsOptional()
  @IsBoolean()
  disponible?: boolean;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(10000)
  orden?: number;
}

export class UpdateItemMenuDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  categoriaId?: string;

  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(120)
  nombre?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  precio?: number;

  @IsOptional()
  @IsString()
  imagenUrl?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  descripcion?: string;

  @IsOptional()
  @IsBoolean()
  disponible?: boolean;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(10000)
  orden?: number;
}
