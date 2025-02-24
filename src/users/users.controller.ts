import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Query, Req, Headers, UsePipes, ValidationPipe } from '@nestjs/common';
import { UsersService } from './users.service';
// import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';

@Controller('users')
@UseGuards(AuthGuard('jwt'))  // Protect user routes
@ApiBearerAuth()  // <-- Required for Swagger
export class UsersController {
  constructor(private readonly usersService: UsersService) { }

  @Get()
  @ApiOperation({ summary: 'Get all users' }) // ✅ Summary in Swagger
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1, description: 'Page number', default: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 10, description: 'Limit number', default: 10 })
  @ApiResponse({ status: 200, description: 'Get All Users successfully' }) // ✅ Success response
  @ApiResponse({ status: 401, description: 'Invalid password credentials' })
  @ApiResponse({ status: 500, description: 'Error Internal Server' }) // Handle conflict error
  // @ApiResponse({ status: 400, description: 'Validation failed' }) // ✅ Error response
  // @ApiResponse({ status: 409, description: 'Email already in use' }) // Handle conflict error
  findAllUsers(
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10
  ) {
    try {
      return this.usersService.findAllUsers(Number(page), Number(limit));
    } catch (error) {
      throw error
    }
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a user' }) // ✅ Summary in Swagger
  @ApiResponse({ status: 200, description: 'Get a User successfully' }) // ✅ Success response
  @ApiResponse({ status: 401, description: 'Invalid password credentials' })
  @ApiResponse({ status: 404, description: 'User not found' }) // ✅ Error response
  @ApiResponse({ status: 500, description: 'Error Internal Server' }) // Handle conflict error
  findOne(@Param('id') id: string) {
    try {
      return this.usersService.findOne(+id);
    } catch (error) {
      throw error
    }
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a user' }) // ✅ Summary in Swagger
  @ApiResponse({ status: 200, description: 'Get a User successfully' }) // ✅ Success response
  @ApiResponse({ status: 401, description: 'Unauthorized' }) // ✅ Error response
  @ApiResponse({ status: 404, description: 'User not found' }) // ✅ Error response
  @ApiResponse({ status: 500, description: 'Error Internal Server' }) // Handle conflict error
  @UsePipes(new ValidationPipe({ whitelist: true, transform: true }))
  update(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto) {
    try {
      // @Headers('authorization') authHeader: string
      // const token = authHeader?.replace('Bearer ', '');token
      return this.usersService.update(+id, updateUserDto);
    } catch (error) {
      throw error
    }
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Remove a user' }) // ✅ Summary in Swagger
  @ApiResponse({ status: 200, description: 'Get a User successfully' }) // ✅ Success response
  @ApiResponse({ status: 401, description: 'Unauthorized' }) // ✅ Error response
  @ApiResponse({ status: 404, description: 'User not found' }) // ✅ Error response
  @ApiResponse({ status: 500, description: 'Error Internal Server' }) // Handle conflict error
  remove(@Param('id') id: string) {
    try {
      // const token = authHeader?.replace('Bearer ', '');
      return this.usersService.remove(+id);
    } catch (error) {
      throw error
    }
  }
}
