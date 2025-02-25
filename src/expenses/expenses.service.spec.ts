import { Test, TestingModule } from '@nestjs/testing';
import { ExpensesService } from './expenses.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { UnauthorizedException, NotFoundException, InternalServerErrorException } from '@nestjs/common';
import { AuthService } from '../auth/auth.service';
import { User } from '../users/entities/user.entity';
import { Expense } from './entities/expense.entity';
import { Category } from '../categories/entities/category.entity';
import { REQUEST } from '@nestjs/core'; // ✅ Import REQUEST token

describe('ExpensesService', () => {
  let service: ExpensesService;
  let authService: AuthService;
  let userRepository;
  let expenseRepository;
  let categoryRepository;

  const mockRequest = { authHeader: 'Bearer mocktoken' }; // ✅ Mocked request object

  const mockAuthService = {
    validateToken: jest.fn(),
  };

  const mockUserRepository = {
    findOne: jest.fn(),
  };

  const mockCategoryRepository = {
    findOne: jest.fn(),
  };

  const mockExpenseRepository = {
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    findAndCount: jest.fn(),
    softRemove: jest.fn(),
    createQueryBuilder: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ExpensesService,
        {
          provide: AuthService,
          useValue: mockAuthService,
        },
        {
          provide: getRepositoryToken(User),
          useValue: mockUserRepository,
        },
        {
          provide: getRepositoryToken(Expense),
          useValue: mockExpenseRepository,
        },
        {
          provide: getRepositoryToken(Category),
          useValue: mockCategoryRepository,
        }, {
          provide: REQUEST, // ✅ Inject the REQUEST object
          useValue: mockRequest,
        },
      ],
    }).compile();

    service = await module.resolve(ExpensesService);
    authService = module.get<AuthService>(AuthService);
    userRepository = module.get(getRepositoryToken(User));
    expenseRepository = module.get(getRepositoryToken(Expense));
    categoryRepository = module.get(getRepositoryToken(Category));

    // ✅ Ensure spies are reset before each test
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create and return an expense if all conditions are met', async () => {
      const userId = 1;
      const categoryId = 2;
      const createExpenseDto = {
        title: 'Groceries',
        amount: 50,
        date: new Date(),
        categoryId,
      };

      const mockCategory = { id: categoryId };
      const mockExpense = {
        id: 1,
        title: createExpenseDto.title,
        amount: createExpenseDto.amount,
        date: createExpenseDto.date,
        category: mockCategory,
        user: { id: userId },
      };

      // Mock responses
      jest.spyOn(authService, 'validateToken').mockResolvedValue({ userId });
      jest.spyOn(categoryRepository, 'findOne').mockResolvedValue(mockCategory);
      jest.spyOn(expenseRepository, 'create').mockReturnValue(mockExpense as any);
      jest.spyOn(expenseRepository, 'save').mockResolvedValue(mockExpense);

      const result = await service.create(createExpenseDto);

      expect(result).toEqual(mockExpense);
      expect(authService.validateToken).toHaveBeenCalledWith(mockRequest.authHeader);
      expect(categoryRepository.findOne).toHaveBeenCalledWith({ where: { id: categoryId } });
      expect(expenseRepository.create).toHaveBeenCalledWith({
        title: createExpenseDto.title,
        amount: createExpenseDto.amount,
        date: createExpenseDto.date,
        category: mockCategory, // ✅ `categoryId` is replaced with full category object
        user: { id: userId }, // ✅ Correctly assigns user
      });
      expect(expenseRepository.save).toHaveBeenCalledWith(mockExpense);
    });

    it('should throw NotFoundException if category does not exist', async () => {
      const userId = 1;
      const categoryId = 2;
      const createExpenseDto = { title: 'Groceries', amount: 50, date: new Date(), categoryId };

      jest.spyOn(authService, 'validateToken').mockResolvedValue({ userId });
      jest.spyOn(categoryRepository, 'findOne').mockResolvedValue(null); // 🚨 Mock category not found
      const createSpy = jest.spyOn(expenseRepository, 'create'); // ✅ Spy on `create()`
      const saveSpy = jest.spyOn(expenseRepository, 'save'); // ✅ Spy on `save()`

      await expect(service.create(createExpenseDto)).rejects.toThrow(NotFoundException);

      expect(authService.validateToken).toHaveBeenCalledWith(mockRequest.authHeader);
      expect(categoryRepository.findOne).toHaveBeenCalledWith({ where: { id: categoryId } });

      expect(createSpy).not.toHaveBeenCalled(); // ✅ Ensures that `create()` was NEVER called
      expect(saveSpy).not.toHaveBeenCalled(); // ✅ Ensures that `save()` was NEVER called
    });

    it('should throw InternalServerErrorException if an unexpected error occurs', async () => {
      const userId = 1;
      const categoryId = 2;
      const createExpenseDto = { title: 'Groceries', amount: 50, date: new Date(), categoryId };
      const mockCategory = { id: categoryId };

      jest.spyOn(authService, 'validateToken').mockResolvedValue({ userId });
      jest.spyOn(categoryRepository, 'findOne').mockResolvedValue(mockCategory);
      jest.spyOn(expenseRepository, 'create').mockReturnValue({} as any);
      jest.spyOn(expenseRepository, 'save').mockRejectedValue(new Error('Database error'));

      await expect(service.create(createExpenseDto)).rejects.toThrow(InternalServerErrorException);

      expect(authService.validateToken).toHaveBeenCalled();
      expect(categoryRepository.findOne).toHaveBeenCalled();
      expect(expenseRepository.create).toHaveBeenCalled();
      expect(expenseRepository.save).toHaveBeenCalled();
    });
  });

  describe('findAll', () => {
    const mockUser = { id: 1, email: 'test@example.com' };
    const mockExpenses = [
      {
        id: 1,
        title: 'Groceries',
        amount: 50,
        date: new Date('2025-02-25'),
        category: { id: 2, name: 'Food' },
        user: { id: 1 },
      },
      {
        id: 2,
        title: 'Electricity Bill',
        amount: 100,
        date: new Date('2025-02-20'),
        category: { id: 3, name: 'Utilities' },
        user: { id: 1 },
      },
    ];
    const mockTotal = mockExpenses.length;

    beforeEach(() => {
      jest.clearAllMocks();

      // ✅ Properly mock `validateToken`
      jest.spyOn(authService, 'validateToken').mockImplementation(async () => ({ userId: mockUser.id }));

      jest.spyOn(userRepository, 'findOne').mockResolvedValue(mockUser);
      jest.spyOn(expenseRepository, 'findAndCount').mockResolvedValue([mockExpenses, mockTotal]);
    });


    it('should return a paginated list of expenses', async () => {
      // Act
      const result = await service.findAll(1, 10);

      // Assert
      expect(authService.validateToken).toHaveBeenCalledWith(mockRequest.authHeader);
      expect(userRepository.findOne).toHaveBeenCalledWith({ where: { id: mockUser.id } });
      expect(expenseRepository.findAndCount).toHaveBeenCalled();
      expect(result).toEqual({
        data: mockExpenses,
        total: mockTotal,
        page: 1,
        limit: 10,
        totalPages: 1,
      });
    });

    it('should throw UnauthorizedException if user is not found', async () => {
      // Arrange: Mock validateToken but return null for findOne (user not found)
      jest.spyOn(authService, 'validateToken').mockResolvedValue({ userId: mockUser.id });
      jest.spyOn(userRepository, 'findOne').mockResolvedValue(null); // Simulate user not found

      // Act & Assert
      await expect(service.findAll(1, 10)).rejects.toThrow(UnauthorizedException);

      expect(authService.validateToken).toHaveBeenCalledWith(mockRequest.authHeader);
      expect(userRepository.findOne).toHaveBeenCalledWith({ where: { id: mockUser.id } });
      expect(expenseRepository.findAndCount).not.toHaveBeenCalled(); // Should not proceed
    });

    it('should throw InternalServerErrorException on database error', async () => {
      // Arrange: Mock validateToken and findOne successfully but force an error on findAndCount
      jest.spyOn(authService, 'validateToken').mockResolvedValue({ userId: mockUser.id });
      jest.spyOn(userRepository, 'findOne').mockResolvedValue(mockUser);
      jest.spyOn(expenseRepository, 'findAndCount').mockRejectedValue(new Error('Database error'));

      // Act & Assert
      await expect(service.findAll(1, 10)).rejects.toThrow(InternalServerErrorException);

      expect(authService.validateToken).toHaveBeenCalledWith(mockRequest.authHeader);
      expect(userRepository.findOne).toHaveBeenCalledWith({ where: { id: mockUser.id } });
      expect(expenseRepository.findAndCount).toHaveBeenCalled();
    });

  });

  describe('findOne', () => {
    // Example Test Case 1: Successfully find an expense  
    it('should return an expense if found', async () => {
      const expenseId = 1;
      const userId = 1;
      const mockExpense = { id: expenseId, amount: 100, description: 'Test Expense' };
      const mockUser = { id: userId };
      // const authHeader = 'Bearer mocktoken';

      jest.spyOn(authService, 'validateToken').mockResolvedValue({ userId });
      jest.spyOn(userRepository, 'findOne').mockResolvedValue(mockUser);
      jest.spyOn(expenseRepository, 'findOne').mockResolvedValue(mockExpense);

      const result = await service.findOne(expenseId);

      expect(result).toEqual(mockExpense);
      expect(authService.validateToken).toHaveBeenCalledWith(mockRequest.authHeader);
      expect(userRepository.findOne).toHaveBeenCalledWith({ where: { id: userId } });
      expect(expenseRepository.findOne).toHaveBeenCalledWith({
        where: { id: expenseId, user: { id: userId } },
        relations: ['user', 'category'],
        select: {
          user: {
            id: true,
            email: true,
            createdAt: true,
            updatedAt: true,
            deletedAt: true,
          },
        },
      });
    });

    // Example Test Case 2: User not found
    it('should throw UnauthorizedException if user is not found', async () => {
      const expenseId = 1;
      const userId = 1;
      // const authHeader = 'Bearer mocktoken';

      mockAuthService.validateToken.mockResolvedValue({ userId });
      mockUserRepository.findOne.mockResolvedValue(null); // Simulating no user found

      await expect(service.findOne(expenseId)).rejects.toThrowError(new UnauthorizedException('User not found'));
    });

    // // Example Test Case 3: Expense not found
    it('should throw NotFoundException if expense is not found', async () => {
      const expenseId = 1;
      const userId = 1;
      const user = { id: userId };
      const authHeader = 'Bearer mocktoken';

      mockAuthService.validateToken.mockResolvedValue({ userId });
      mockUserRepository.findOne.mockResolvedValue(user);  // User is found
      mockExpenseRepository.findOne.mockResolvedValue(null);  // No expense found

      await expect(service.findOne(expenseId)).rejects.toThrowError(
        new NotFoundException(`Expenexpense with ID ${expenseId} and user ID ${userId} not found`)
      );
    });

    // Example Test Case 4: Internal server error
    it('should throw InternalServerErrorException if unexpected error occurs', async () => {
      const expenseId = 1;
      const userId = 1;
      const authHeader = 'Bearer mocktoken';

      mockAuthService.validateToken.mockResolvedValue({ userId });
      mockUserRepository.findOne.mockResolvedValue({ id: userId });
      mockExpenseRepository.findOne.mockRejectedValue(new Error('Unexpected error'));  // Simulating unexpected error

      await expect(service.findOne(expenseId)).rejects.toThrowError(new InternalServerErrorException('Error occurred while fetching expense'));
    });

  });

  describe('update', () => {
    it('should successfully update an expense', async () => {
      const mockUser = { id: 1, email: 'test@example.com' } as User;
      const mockExpense = { id: 1, title: 'Old Title', amount: 100, user: mockUser } as Expense;
      const updateDto = { title: 'New Title', amount: 200 };

      jest.spyOn(authService, 'validateToken').mockResolvedValue({ userId: 1 });
      jest.spyOn(userRepository, 'findOne').mockResolvedValue(mockUser);
      jest.spyOn(expenseRepository, 'findOne').mockResolvedValue(mockExpense);
      jest.spyOn(expenseRepository, 'save').mockResolvedValue({ ...mockExpense, ...updateDto });

      const result = await service.update(1, updateDto);

      expect(result?.title).toBe('New Title');
      expect(result?.amount).toBe(200);
    });

    it('should throw UnauthorizedException if user is not found', async () => {
      jest.spyOn(authService, 'validateToken').mockResolvedValue({ userId: 1 });
      jest.spyOn(userRepository, 'findOne').mockResolvedValue(null);

      await expect(service.update(1, {})).rejects.toThrow(UnauthorizedException);
    });

    it('should throw NotFoundException if expense is not found', async () => {
      jest.spyOn(authService, 'validateToken').mockResolvedValue({ userId: 1 });
      jest.spyOn(userRepository, 'findOne').mockResolvedValue({ id: 1 } as User);
      jest.spyOn(expenseRepository, 'findOne').mockResolvedValue(null);

      await expect(service.update(1, {})).rejects.toThrow(NotFoundException);
    });

    it('should throw NotFoundException if category is not found', async () => {
      const updateDto = { categoryId: 99 };
      jest.spyOn(authService, 'validateToken').mockResolvedValue({ userId: 1 });
      jest.spyOn(userRepository, 'findOne').mockResolvedValue({ id: 1 } as User);
      jest.spyOn(expenseRepository, 'findOne').mockResolvedValue({ id: 1, user: { id: 1 } } as Expense);
      jest.spyOn(categoryRepository, 'findOne').mockResolvedValue(null);

      await expect(service.update(1, updateDto)).rejects.toThrow(NotFoundException);
    });

    it('should throw InternalServerErrorException on unexpected errors', async () => {
      jest.spyOn(authService, 'validateToken').mockRejectedValue(new Error('Unexpected error'));

      await expect(service.update(1, {})).rejects.toThrow(InternalServerErrorException);
    });
  })

  describe('remove', () => {

    it('should successfully remove an expense', async () => {
      const mockUser = { id: 1 } as User;
      const mockExpense = { id: 1, user: mockUser } as Expense;

      jest.spyOn(authService, 'validateToken').mockResolvedValue({ userId: 1 });
      jest.spyOn(userRepository, 'findOne').mockResolvedValue(mockUser);
      jest.spyOn(expenseRepository, 'findOne').mockResolvedValue(mockExpense);
      jest.spyOn(expenseRepository, 'softRemove').mockResolvedValue(mockExpense);

      const result = await service.remove(1);
      expect(result).toEqual({ message: 'Expense with ID 1 has been soft deleted' });
    });

    it('should throw UnauthorizedException if user is not found', async () => {
      jest.spyOn(authService, 'validateToken').mockResolvedValue({ userId: 1 });
      jest.spyOn(userRepository, 'findOne').mockResolvedValue(null);

      await expect(service.remove(1)).rejects.toThrow(UnauthorizedException);
    });

    it('should throw NotFoundException if expense is not found', async () => {
      jest.spyOn(authService, 'validateToken').mockResolvedValue({ userId: 1 });
      jest.spyOn(userRepository, 'findOne').mockResolvedValue({ id: 1 } as User);
      jest.spyOn(expenseRepository, 'findOne').mockResolvedValue(null);

      await expect(service.remove(1)).rejects.toThrow(NotFoundException);
    });

    it('should throw InternalServerErrorException on unexpected errors', async () => {
      jest.spyOn(authService, 'validateToken').mockRejectedValue(new Error('Unexpected error'));

      await expect(service.remove(1)).rejects.toThrow(InternalServerErrorException);
    });
  })

  describe('generateReport', () => {
    it('should successfully generate a report', async () => {
      const mockReport = [{ categoryId: 1, categoryName: 'Food', totalAmount: 100 }];
      jest.spyOn(authService, 'validateToken').mockResolvedValue({ userId: 1 });
      jest.spyOn(userRepository, 'findOne').mockResolvedValue({ id: 1 } as User);
      jest.spyOn(expenseRepository, 'createQueryBuilder').mockReturnValue({
        select: jest.fn().mockReturnThis(),
        addSelect: jest.fn().mockReturnThis(),
        innerJoin: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        groupBy: jest.fn().mockReturnThis(),
        addGroupBy: jest.fn().mockReturnThis(),
        getRawMany: jest.fn().mockResolvedValue(mockReport),
      } as any);

      const result = await service.generateReport('2024-01-01', '2024-01-31');
      expect(result).toEqual(mockReport);
    });

    it('should throw UnauthorizedException if user is not found', async () => {
      jest.spyOn(authService, 'validateToken').mockResolvedValue({ userId: 1 });
      jest.spyOn(userRepository, 'findOne').mockResolvedValue(null);

      await expect(service.generateReport('2024-01-01', '2024-01-31')).rejects.toThrow(UnauthorizedException);
    });

    it('should throw NotFoundException if no expenses found', async () => {
      jest.spyOn(authService, 'validateToken').mockResolvedValue({ userId: 1 });
      jest.spyOn(userRepository, 'findOne').mockResolvedValue({ id: 1 } as User);
      jest.spyOn(expenseRepository, 'createQueryBuilder').mockReturnValue({
        select: jest.fn().mockReturnThis(),
        addSelect: jest.fn().mockReturnThis(),
        innerJoin: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        groupBy: jest.fn().mockReturnThis(),
        addGroupBy: jest.fn().mockReturnThis(),
        getRawMany: jest.fn().mockResolvedValue([]),
      } as any);

      await expect(service.generateReport('2024-01-01', '2024-01-31')).rejects.toThrow(NotFoundException);
    });

    it('should throw InternalServerErrorException on unexpected errors', async () => {
      jest.spyOn(authService, 'validateToken').mockRejectedValue(new Error('Unexpected error'));

      await expect(service.generateReport('2024-01-01', '2024-01-31')).rejects.toThrow(InternalServerErrorException);
    });

  });
});
