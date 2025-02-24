import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, UsePipes, ValidationPipe, Query, UseInterceptors } from '@nestjs/common';
import { ExpensesService } from './expenses.service';
import { CreateExpenseDto } from './dto/create-expense.dto';
import { UpdateExpenseDto } from './dto/update-expense.dto';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { AuthHeaderInterceptor } from '../auth/auth-header.interceptor';

@Controller('expense')
@UseInterceptors(AuthHeaderInterceptor)
@UseGuards(AuthGuard('jwt'))  // Protect all endpoints
@ApiBearerAuth()  // <-- Required for Swagger
export class ExpensesController {
  constructor(private readonly expensesService: ExpensesService) { }

  @Get('report')
  @ApiOperation({ summary: 'Get a report' }) // ✅ Summary in Swagger
  @ApiResponse({ status: 200, description: 'Get a report successfully' }) // ✅ Success response
  @ApiResponse({ status: 404, description: 'report not found' }) // ✅ Error response
  @ApiResponse({ status: 500, description: 'Error Internal Server' }) // Handle conflict error
  generateReport(
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ) {
    try {
      return this.expensesService.generateReport(startDate, endDate);
    } catch (error) {
      throw error
    }
  }

  @Post()
  @ApiOperation({ summary: 'Create a new expense' }) // ✅ Summary in Swagger
  @ApiResponse({ status: 201, description: 'expense created successfully' }) // ✅ Success response
  @ApiResponse({ status: 400, description: 'Validation failed' }) // ✅ Error response
  @ApiResponse({ status: 404, description: 'Category not found' }) // Handle conflict error
  @ApiResponse({ status: 500, description: 'Error Internal Server' }) // Handle conflict error
  @UsePipes(new ValidationPipe({ whitelist: true, transform: true }))
  create(@Body() createExpenseDto: CreateExpenseDto) {
    try {
      return this.expensesService.create(createExpenseDto);
    } catch (error) {
      throw error
    }
  }

  // find all by date range ? and separate by category ? + pagination
  // by category

  @Get()
  @ApiOperation({ summary: 'Get all categories' }) // ✅ Summary in Swagger
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1, description: 'Page number', default: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 10, description: 'Limit number', default: 10 })
  @ApiQuery({ name: 'startDate', required: false, type: Date, example: '2022-12-12', description: 'Start Date' })
  @ApiQuery({ name: 'endDate', required: false, type: Date, example: '2024-12-12', description: 'End Date' })
  @ApiQuery({ name: 'categoryId', required: false, type: Number, description: 'CategoryId' })
  @ApiResponse({ status: 200, description: 'Get All categories successfully' }) // ✅ Success response
  @ApiResponse({ status: 401, description: 'Invalid password credentials' })
  @ApiResponse({ status: 500, description: 'Error Internal Server' }) // Handle conflict error
  findAll(
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
    @Query('categoryId') categoryId: number,
  ) {
    try {
      return this.expensesService.findAll(Number(page), Number(limit), startDate, endDate, categoryId);
    } catch (error) {
      throw error
    }
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a expense' }) // ✅ Summary in Swagger
  @ApiResponse({ status: 200, description: 'Get a expense successfully' }) // ✅ Success response
  @ApiResponse({ status: 404, description: 'expense not found' }) // ✅ Error response
  @ApiResponse({ status: 500, description: 'Error Internal Server' }) // Handle conflict error
  findOne(@Param('id') id: string) {
    try {
      return this.expensesService.findOne(+id);
    } catch (error) {
      throw error
    }
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a expense' }) // ✅ Summary in Swagger
  @ApiResponse({ status: 200, description: 'Update a expense successfully' }) // ✅ Success response
  @ApiResponse({ status: 401, description: 'Unauthorized' }) // ✅ Error response
  @ApiResponse({ status: 404, description: 'expense not found' }) // ✅ Error response
  @ApiResponse({ status: 409, description: 'expense with the name is already exists' }) // ✅ Error response
  @ApiResponse({ status: 500, description: 'Error Internal Server' }) // Handle conflict error
  @UsePipes(new ValidationPipe({ whitelist: true, transform: true }))
  update(@Param('id') id: string, @Body() updateExpenseDto: UpdateExpenseDto) {
    try {
      return this.expensesService.update(+id, updateExpenseDto);
    } catch (error) {
      throw error
    }
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Remove a expense' }) // ✅ Summary in Swagger
  @ApiResponse({ status: 200, description: 'Update a expense successfully' }) // ✅ Success response
  @ApiResponse({ status: 401, description: 'Unauthorized' }) // ✅ Error response
  @ApiResponse({ status: 404, description: 'expense not found' }) // ✅ Error response
  @ApiResponse({ status: 500, description: 'Error Internal Server' }) // Handle conflict error
  remove(@Param('id') id: string) {
    try {
      return this.expensesService.remove(+id);
    } catch (error) {
      throw error
    }
  }
}
