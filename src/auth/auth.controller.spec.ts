import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { RegisterDto, LoginDto } from './dto/auth.dto';
import { ConflictException, InternalServerErrorException, UnauthorizedException } from '@nestjs/common';

describe('AuthController', () => {
  let authController: AuthController;
  let authService: AuthService;
  let mockUser: any;

  beforeEach(async () => {
    // Define the mockUser object that will be used across tests
    mockUser = {
      id: 1,
      email: 'test@example.com',
      password: 'password123',
      createdAt: new Date(),
      updatedAt: new Date(),
      deletedAt: null,
      hashPassword: jest.fn(),
      validatePassword: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: {
            register: jest.fn(),
            login: jest.fn(),
          },
        },
      ],
    }).compile();

    authController = module.get<AuthController>(AuthController);
    authService = module.get<AuthService>(AuthService);
  });

  describe('register', () => {
    it('should successfully register a user', async () => {
      const registerDto: RegisterDto = { email: 'test@example.com', password: 'password123' };

      // Mock the behavior of repository and service methods
      jest.spyOn(authService, 'register').mockResolvedValue(mockUser);
      
      const result = await authController.register(registerDto);

      expect(result).toEqual(mockUser); // Verify that the result matches mockUser
    });

    it('should throw ConflictException if email is already in use', async () => {
      const registerDto: RegisterDto = { email: 'test@example.com', password: 'password123' };

      // Simulate conflict error
      jest.spyOn(authService, 'register').mockRejectedValue(new ConflictException('Email already in use'));

      try {
        await authController.register(registerDto);
      } catch (error) {
        expect(error).toBeInstanceOf(ConflictException);
        expect(error.message).toBe('Email already in use');
      }
    });

    it('should throw InternalServerErrorException if something goes wrong', async () => {
      const registerDto: RegisterDto = { email: 'test@example.com', password: 'password123' };

      // Simulate an internal server error in the service layer
      jest.spyOn(authService, 'register').mockRejectedValue(new InternalServerErrorException('Something went wrong during registration'));

      try {
        await authController.register(registerDto);
      } catch (error) {
        expect(error).toBeInstanceOf(InternalServerErrorException);
        expect(error.message).toBe('Something went wrong during registration');
      }
    });
  });

  describe('login', () => {
    it('should return JWT token when login is successful', async () => {
      const loginDto: LoginDto = { email: 'test@example.com', password: 'password123' };
      const jwtToken = 'JWT_TOKEN';

      // Mock successful login and token signing
      jest.spyOn(authService, 'login').mockResolvedValue({ access_token: jwtToken });

      const result = await authController.login(loginDto);

      expect(result).toEqual({ access_token: jwtToken }); // Verify the token returned
    });

    it('should throw UnauthorizedException if credentials are invalid', async () => {
      const loginDto: LoginDto = { email: 'test@example.com', password: 'wrongpassword' };

      // Simulate invalid credentials error
      jest.spyOn(authService, 'login').mockRejectedValue(new UnauthorizedException('Invalid credentials'));

      try {
        await authController.login(loginDto);
      } catch (error) {
        expect(error).toBeInstanceOf(UnauthorizedException);
        expect(error.message).toBe('Invalid credentials');
      }
    });
  });
});
