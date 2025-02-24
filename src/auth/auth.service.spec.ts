import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { JwtService, JwtModule } from '@nestjs/jwt';
import { Repository } from 'typeorm';
import { User } from '../users/entities/user.entity';
import { RegisterDto, LoginDto } from './dto/auth.dto';
import { ConflictException, InternalServerErrorException, UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';
import { Expense } from 'src/expenses/entities/expense.entity';

describe('AuthService', () => {
  let authService: AuthService;
  let userRepository: Repository<User>;
  let jwtService: JwtService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [
        JwtModule.register({
          secret: 'testSecret', // Provide a test secret key
          signOptions: { expiresIn: '1h' },
        }),
      ],
      providers: [
        AuthService,
        {
          provide: JwtService,
          useFactory: () => {
            return new JwtService({
              secret: 'testSecret', // Provide a test secret
              signOptions: { expiresIn: '1h' },
            });
          },
        },
        {
          provide: getRepositoryToken(User),  // Use getRepositoryToken to mock the Repository
          useValue: {
            findOne: jest.fn(),
            save: jest.fn(),
            // You can add other methods you need like `remove`, `find`, etc.
          },
          useClass: Repository, // Mock TypeORM Repository
        },
        {
          provide: ConfigService,
          useValue: { get: jest.fn().mockReturnValue('your_super_secret_key') }, // Mock env variable
        },
      ],
    }).compile();

    authService = module.get<AuthService>(AuthService);
    userRepository = module.get<Repository<User>>(getRepositoryToken(User));  // Inject the mocked repository
    jwtService = module.get<JwtService>(JwtService);
  });

  describe('register', () => {
    it('should successfully register a user', async () => {
      const registerDto: RegisterDto = { email: 'test@example.com', password: 'password123' };

      const mockUser = {
        id: 1,
        email: registerDto.email,
        password: 'hashedPassword123', // Mock the password after hashing
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
      };

      // Mock findOne to return null (no user exists with this email)
      jest.spyOn(userRepository, 'findOne').mockResolvedValue(null);

      // Mock the save method to return the plain mock user object
      jest.spyOn(userRepository, 'save').mockResolvedValue({
        id: 1,
        email: 'test@example.com',
        password: 'hashedPassword123',
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
      } as Partial<User> as User);  // Force type casting to User

      // Mock the hashPassword method to simulate password hashing
      jest.spyOn(bcrypt, 'hash').mockResolvedValue('hashedPassword123');

      const result = await authService.register(registerDto);

      expect(result).toEqual(mockUser);  // Ensure result matches the plain object
      expect(userRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          email: 'test@example.com',
          password: 'hashedPassword123',
          createdAt: expect.any(Date),
          updatedAt: expect.any(Date),
          deletedAt: null,
        }),
      );
    });

    it('should throw ConflictException if email is already in use', async () => {
      const existingUser = new User();
      existingUser.email = 'test@example.com';

      jest.spyOn(userRepository, 'findOne').mockResolvedValue(existingUser); // Mock user exists

      const registerDto: RegisterDto = { email: 'test@example.com', password: 'password123' };
      await expect(authService.register(registerDto)).rejects.toThrow(ConflictException);
    });

    it('should throw InternalServerErrorException if saving the user fails', async () => {
      const registerDto: RegisterDto = { email: 'test@example.com', password: 'password123' };

      // Mock findOne to return null (no user exists with this email)
      jest.spyOn(userRepository, 'findOne').mockResolvedValue(null);

      // Mock save to simulate an error during user creation
      jest.spyOn(userRepository, 'save').mockRejectedValue(new Error('Database error'));

      try {
        await authService.register(registerDto);
      } catch (error) {
        expect(error).toBeInstanceOf(InternalServerErrorException);
        expect(error.message).toBe('Error occurred while registering user');
      }
    });
  });

  describe('login', () => {
    it('should return a JWT token if login is successful', async () => {
      // Arrange: Create a fake user with a mocked validatePassword method
      const fakeUser = {
        id: 1,
        email: 'test@example.com',
        password: 'hashedPassword123',
        expenses: [],
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
        hashPassword: jest.fn(),
        validatePassword: jest.fn().mockResolvedValue(true),
      };

      // Ensure the repository returns the fake user when finding by email
      jest.spyOn(userRepository, 'findOne').mockResolvedValue(fakeUser);

      // Spy on jwtService.sign to return a dummy token instead of a real one
      jest.spyOn(jwtService, 'sign').mockReturnValue('dummyToken');

      // Act: Call the login method
      const result = await authService.login('test@example.com', 'validPassword');

      // Assert: Check that validatePassword was called correctly and token was returned
      expect(fakeUser.validatePassword).toHaveBeenCalledWith('validPassword');
      expect(result).toEqual({ access_token: expect.any(String) });
    });

    it('should throw InternalServerErrorException when a database error occurs', async () => {
      // Arrange: simulate a database error in findUserByEmail
      const dbErrorMessage = 'Database error';
      jest.spyOn(authService, 'findUserByEmail').mockRejectedValue(new Error(dbErrorMessage));

      // Act & Assert: the login method should throw an InternalServerErrorException
      await expect(
        authService.login('test@example.com', 'anyPassword'),
      ).rejects.toThrowError(new InternalServerErrorException(dbErrorMessage));
    });
    
    it('should throw UnauthorizedException if password is incorrect', async () => {
      const loginDto: LoginDto = { email: 'test@example.com', password: 'wrongPassword' };
      const mockUser: User = {
        id: 1,
        email: loginDto.email,
        password: 'hashedPassword123',
        expenses: [],
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
        hashPassword: jest.fn(),
        validatePassword: jest.fn(),
      };

      // Mock findOne to return a user
      jest.spyOn(userRepository, 'findOne').mockResolvedValue(mockUser);

      // Mock the password comparison to return false (incorrect password)
      jest.spyOn(bcrypt, 'compare').mockResolvedValue(false);

      try {
        await authService.login(loginDto.email, loginDto.password);
      } catch (error) {
        expect(error).toBeInstanceOf(UnauthorizedException);
        expect(error.message).toBe('Invalid password credentials');
      }
    });

    it('should throw UnauthorizedException if email is not found', async () => {
      const loginDto: LoginDto = { email: 'test@example.com', password: 'password123' };

      // Mock findOne to return null (no user found)
      jest.spyOn(userRepository, 'findOne').mockResolvedValue(null);

      try {
        await authService.login(loginDto.email, loginDto.password);
      } catch (error) {
        expect(error).toBeInstanceOf(UnauthorizedException);
        expect(error.message).toBe('Invalid credentials');
      }
    });
  });

  describe('validateUser', () => {
    it('should return a user if one is found by id', async () => {
      // Arrange: create a fake user object and mock repository
      const fakeUser = { id: 1, email: 'test@example.com' } as User;
      jest.spyOn(userRepository, 'findOne').mockResolvedValue(fakeUser);

      // Act: call validateUser
      const result = await authService.validateUser(1);

      // Assert: expect the returned user to match the fake user
      expect(result).toEqual(fakeUser);
      expect(userRepository.findOne).toHaveBeenCalledWith({ where: { id: 1 } });
    });

    it('should return null if no user is found', async () => {
      // Arrange: simulate no user found
      jest.spyOn(userRepository, 'findOne').mockResolvedValue(null);

      // Act: call validateUser
      const result = await authService.validateUser(1);

      // Assert: expect result to be null
      expect(result).toBeNull();
    });

    it('should throw InternalServerErrorException when a repository error occurs', async () => {
      // Arrange: simulate a database error
      jest.spyOn(userRepository, 'findOne').mockRejectedValue(new Error('DB error'));

      // Act & Assert: validateUser should throw an InternalServerErrorException
      await expect(authService.validateUser(1)).rejects.toThrowError(
        new InternalServerErrorException('Error occurred while fetching user'),
      );
    });
  });

  describe('findUserByEmail', () => {
    it('should return a user if one is found by email', async () => {
      // Arrange: create a fake user object and mock repository
      const fakeUser = { id: 1, email: 'test@example.com' } as User;
      jest.spyOn(userRepository, 'findOne').mockResolvedValue(fakeUser);

      // Act: call findUserByEmail
      const result = await authService.findUserByEmail('test@example.com');

      // Assert: expect the returned user to match the fake user
      expect(result).toEqual(fakeUser);
      expect(userRepository.findOne).toHaveBeenCalledWith({ where: { email: 'test@example.com' } });
    });

    it('should return null if no user is found', async () => {
      // Arrange: simulate no user found
      jest.spyOn(userRepository, 'findOne').mockResolvedValue(null);

      // Act: call findUserByEmail
      const result = await authService.findUserByEmail('nonexistent@example.com');

      // Assert: expect result to be null
      expect(result).toBeNull();
    });

    it('should throw InternalServerErrorException when a repository error occurs', async () => {
      // Arrange: simulate a database error
      jest.spyOn(userRepository, 'findOne').mockRejectedValue(new Error('DB error'));

      // Act & Assert: findUserByEmail should throw an InternalServerErrorException
      await expect(
        authService.findUserByEmail('test@example.com'),
      ).rejects.toThrowError(
        new InternalServerErrorException('Error occurred while fetching user'),
      );
    });
  });

});
