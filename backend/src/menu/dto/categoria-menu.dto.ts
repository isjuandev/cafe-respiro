import { IsInt, IsOptional, IsString, MaxLength, Min, MinLength } from 'class-validator';

export class CreateCategoriaMenuDto {
  @IsString()
  @MinLength(2)
  @MaxLength(80)
  nombre!: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  orden?: number;
}

export class UpdateCategoriaMenuDto {
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(80)
  nombre?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  orden?: number;
}
