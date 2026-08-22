import { Controller, Get, Post, Body, Res } from '@nestjs/common';
import { Response } from 'express';
import { SugerenciasService } from './sugerencias.service';
import { CreateSugerenciaDto } from './dto/create-sugerencia.dto';

@Controller('sugerencias')
export class SugerenciasController {
  constructor(private readonly sugerenciasService: SugerenciasService) {}

  @Get()
  async findActivas() {
    const sugerencias = await this.sugerenciasService.findActivas();
    return { sugerencias };
  }

  @Post()
  async create(
    @Body() dto: CreateSugerenciaDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.sugerenciasService.create(dto);
    res.status(result.duplicada ? 200 : 201);
    return result;
  }
}
