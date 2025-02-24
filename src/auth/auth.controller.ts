import { Controller, Post, Body, UsePipes, ValidationPipe } from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterDto, LoginDto } from './dto/auth.dto';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('Auth') // ✅ Group under "Auth" section in Swagger
@Controller('auth')
@ApiBearerAuth()  // <-- Required for Swagger
export class AuthController {
  constructor(private readonly authService: AuthService) { }

  @Post('register')
  @ApiOperation({ summary: 'Register a new user' }) // ✅ Summary in Swagger
  @ApiResponse({ status: 201, description: 'User registered successfully' }) // ✅ Success response
  @ApiResponse({ status: 400, description: 'Validation failed' }) // ✅ Error response
  @ApiResponse({ status: 409, description: 'Email already in use' }) // Handle conflict error
  @ApiResponse({ status: 500, description: 'Error Internal Server' }) // Handle conflict error
  @UsePipes(new ValidationPipe({ whitelist: true, transform: true }))
  register(@Body() registerDto: RegisterDto) {
    try {
      return this.authService.register(registerDto);
    } catch (error) {
      throw error
    }
  }

  @Post('login')
  @ApiOperation({ summary: 'Login user and get JWT token' }) // ✅ Adds description in Swagger
  // @ApiResponse({ status: 200, description: 'User logged in successfully' })
  @ApiResponse({ status: 201, description: 'User logged in successfully' })
  @ApiResponse({ status: 401, description: 'Invalid password credentials' })
  @ApiResponse({ status: 500, description: 'Error Internal Server' }) // Handle conflict error
  @UsePipes(new ValidationPipe({ whitelist: true, transform: true }))
  login(@Body() loginDto: LoginDto) {
    try {
      return this.authService.login(loginDto.email, loginDto.password);
    } catch (error) {
      throw error
    }
  }
}
