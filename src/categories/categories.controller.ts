import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, UsePipes, ValidationPipe, Query } from '@nestjs/common';
import { CategoriesService } from './categories.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';

@Controller('category')
@UseGuards(AuthGuard('jwt'))  // Protect user routes
@ApiBearerAuth()  // <-- Required for Swagger
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) { }

  @Post()
  @ApiOperation({ summary: 'Create a new category' }) // ✅ Summary in Swagger
  @ApiResponse({ status: 201, description: 'Category created successfully' }) // ✅ Success response
  @ApiResponse({ status: 400, description: 'Validation failed' }) // ✅ Error response
  @ApiResponse({ status: 401, description: 'Invalid password credentials' })
  @ApiResponse({ status: 409, description: 'Category name already in use' }) // Handle conflict error
  @ApiResponse({ status: 500, description: 'Error Internal Server' }) // Handle conflict error
  @UsePipes(new ValidationPipe({ whitelist: true, transform: true }))
  create(@Body() createCategoryDto: CreateCategoryDto) {
    try {
      return this.categoriesService.create(createCategoryDto);
    } catch (error) {
      throw error
    }
  }

  @Get()
  @ApiOperation({ summary: 'Get all categories' }) // ✅ Summary in Swagger
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1, description: 'Page number', default: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 10, description: 'Limit number', default: 10 })
  @ApiResponse({ status: 200, description: 'Get All categories successfully' }) // ✅ Success response
  @ApiResponse({ status: 401, description: 'Invalid password credentials' })
  @ApiResponse({ status: 500, description: 'Error Internal Server' }) // Handle conflict error
  findAll(
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10
  ) {
    try {
      return this.categoriesService.findAll(Number(page), Number(limit));
    } catch (error) {
      throw error
    }
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a category' }) // ✅ Summary in Swagger
  @ApiResponse({ status: 200, description: 'Get a category successfully' }) // ✅ Success response
  @ApiResponse({ status: 401, description: 'Invalid password credentials' })
  @ApiResponse({ status: 404, description: 'Category not found' }) // ✅ Error response
  @ApiResponse({ status: 500, description: 'Error Internal Server' }) // Handle conflict error
  findOne(@Param('id') id: string) {
    try {
      return this.categoriesService.findOne(+id);
    } catch (error) {
      throw error
    }
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a category' }) // ✅ Summary in Swagger
  @ApiResponse({ status: 200, description: 'Update a category successfully' }) // ✅ Success response
  @ApiResponse({ status: 401, description: 'Unauthorized' }) // ✅ Error response
  @ApiResponse({ status: 404, description: 'Category not found' }) // ✅ Error response
  @ApiResponse({ status: 409, description: 'Category with the name is already exists' }) // ✅ Error response
  @ApiResponse({ status: 500, description: 'Error Internal Server' }) // Handle conflict error
  @UsePipes(new ValidationPipe({ whitelist: true, transform: true }))
  update(@Param('id') id: string, @Body() updateCategoryDto: UpdateCategoryDto) {
    try {
      return this.categoriesService.update(+id, updateCategoryDto);
    } catch (error) {
      throw error
    }
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Remove a category' }) // ✅ Summary in Swagger
  @ApiResponse({ status: 200, description: 'Update a category successfully' }) // ✅ Success response
  @ApiResponse({ status: 401, description: 'Unauthorized' }) // ✅ Error response
  @ApiResponse({ status: 404, description: 'Category not found' }) // ✅ Error response
  @ApiResponse({ status: 500, description: 'Error Internal Server' }) // Handle conflict error
  remove(@Param('id') id: string) {
    try {
      return this.categoriesService.remove(+id);
    } catch (error) {
      throw error
    }
  }
}
