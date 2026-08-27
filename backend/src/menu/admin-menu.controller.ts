import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { AuthGuard } from '../common/guards/auth.guard';
import { RequireRole } from '../common/decorators/require-role.decorator';
import { MenuService } from './menu.service';
import { CreateCategoriaMenuDto, UpdateCategoriaMenuDto } from './dto/categoria-menu.dto';
import { CreateItemMenuDto, UpdateItemMenuDto } from './dto/item-menu.dto';

@UseGuards(AuthGuard)
@RequireRole('admin')
@Controller('admin/menu')
export class AdminMenuController {
  constructor(private menu: MenuService) {}

  @Get()
  findAdmin() { return this.menu.findAdmin(); }

  @Post('categorias')
  createCategoria(@Body() dto: CreateCategoriaMenuDto) { return this.menu.createCategoria(dto); }

  @Patch('categorias/:id')
  updateCategoria(@Param('id') id: string, @Body() dto: UpdateCategoriaMenuDto) { return this.menu.updateCategoria(id, dto); }

  @Delete('categorias/:id')
  deleteCategoria(@Param('id') id: string) { return this.menu.deleteCategoria(id); }

  @Post('items')
  createItem(@Body() dto: CreateItemMenuDto) { return this.menu.createItem(dto); }

  @Patch('items/:id')
  updateItem(@Param('id') id: string, @Body() dto: UpdateItemMenuDto) { return this.menu.updateItem(id, dto); }

  @Patch('items/:id/disponibilidad')
  toggleItem(@Param('id') id: string) { return this.menu.toggleItem(id); }

  @Delete('items/:id')
  deleteItem(@Param('id') id: string) { return this.menu.deleteItem(id); }
}
