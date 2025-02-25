import { Test, TestingModule } from '@nestjs/testing';
import { ExpensesController } from './expenses.controller';
import { ExpensesService } from './expenses.service';
import { CreateExpenseDto } from './dto/create-expense.dto';
import { UpdateExpenseDto } from './dto/update-expense.dto';
import { InternalServerErrorException, NotFoundException } from '@nestjs/common';

describe('ExpensesController', () => {
  let controller: ExpensesController;
  let service: ExpensesService;

  const mockCategory = {
    id: 1,
    name: 'food',
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
  };

  const mockUser = {
    id: 1,
    email: 'asd@asd.asd',
    amount: 100.0,
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
  };

  const mockExpense = {
    id: 1,
    title: 'Grocery Shopping',
    amount: 100.0,
    date: new Date(),
    user: mockUser,
    category: mockCategory,
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
  };

  const mockExpensesService = {
    generateReport: jest.fn().mockResolvedValue({ category: 'Food', total: 100.0 }),
    create: jest.fn().mockResolvedValue(mockExpense),
    findAll: jest.fn().mockResolvedValue([mockExpense]),
    findOne: jest.fn().mockResolvedValue(mockExpense),
    update: jest.fn().mockResolvedValue({ ...mockExpense, amount: 120.0 }),
    remove: jest.fn().mockResolvedValue({ deleted: true }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ExpensesController],
      providers: [{ provide: ExpensesService, useValue: mockExpensesService }],
    }).compile();

    controller = module.get<ExpensesController>(ExpensesController);
    service = module.get<ExpensesService>(ExpensesService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('generateReport', () => {
    it('should return a report', async () => {
      expect(await controller.generateReport('2024-01-01', '2024-02-01')).toEqual({
        category: 'Food',
        total: 100.0,
      });
      expect(service.generateReport).toHaveBeenCalledWith('2024-01-01', '2024-02-01');
    });
    it('should throw InternalServerErrorException if something goes wrong', async () => {
      // Simulate an internal server error in the service layer
      jest.spyOn(service, 'generateReport').mockRejectedValue(new InternalServerErrorException('Something went wrong during generateReport'));
      try {
        await controller.generateReport('2024-01-01', '2024-02-01');
      } catch (error) {
        expect(error).toBeInstanceOf(InternalServerErrorException);
        expect(error.message).toBe('Something went wrong during generateReport');
      }
    });
  });

  describe('create', () => {
    it('should create an expense', async () => {
      const dto: CreateExpenseDto = {
        title: 'Grocery Shopping',
        amount: 100.0,
        date: new Date(),
        categoryId: 1,
      };
      expect(await controller.create(dto)).toEqual(mockExpense);
      expect(service.create).toHaveBeenCalledWith(dto);
    });
    it('should throw InternalServerErrorException if something goes wrong', async () => {
      const dto: CreateExpenseDto = {
        title: 'Grocery Shopping',
        amount: 100.0,
        date: new Date(),
        categoryId: 1,
      };
      // Simulate an internal server error in the service layer
      jest.spyOn(service, 'create').mockRejectedValue(new InternalServerErrorException('Something went wrong during create'));
      try {
        await controller.create(dto);
      } catch (error) {
        expect(error).toBeInstanceOf(InternalServerErrorException);
        expect(error.message).toBe('Something went wrong during create');
      }
    });
  });

  describe('findAll', () => {
    it('should return an array of expenses', async () => {
      expect(await controller.findAll(1, 10, '', '', 1)).toEqual([mockExpense]);
    });
    it('should throw InternalServerErrorException if something goes wrong', async () => {
      // Simulate an internal server error in the service layer
      jest.spyOn(service, 'findAll').mockRejectedValue(new InternalServerErrorException('Something went wrong during findAll'));
      try {
        await controller.findAll(1, 10, '', '', 1);
      } catch (error) {
        expect(error).toBeInstanceOf(InternalServerErrorException);
        expect(error.message).toBe('Something went wrong during findAll');
      }
    });
  });

  describe('findOne', () => {
    it('should return a single expense', async () => {
      expect(await controller.findOne('1')).toEqual(mockExpense);
    });

    it('should throw NotFoundException if expense not found', async () => {
      jest.spyOn(service, 'findOne').mockRejectedValue(new NotFoundException('Expense not found'));
      await expect(controller.findOne('99')).rejects.toThrow(NotFoundException);
    });

    it('should throw InternalServerErrorException if something goes wrong', async () => {
      // Simulate an internal server error in the service layer
      jest.spyOn(service, 'findOne').mockRejectedValue(new InternalServerErrorException('Something went wrong during findOne'));
      try {
        await controller.findOne('1');
      } catch (error) {
        expect(error).toBeInstanceOf(InternalServerErrorException);
        expect(error.message).toBe('Something went wrong during findOne');
      }
    });
  });

  describe('update', () => {
    it('should update an expense', async () => {
      const dto: UpdateExpenseDto = { amount: 120.0 };
      expect(await controller.update('1', dto)).toEqual({ ...mockExpense, amount: 120.0 });
    });
    it('should throw InternalServerErrorException if something goes wrong', async () => {
      const dto: UpdateExpenseDto = { amount: 120.0 };
      // Simulate an internal server error in the service layer
      jest.spyOn(service, 'update').mockRejectedValue(new InternalServerErrorException('Something went wrong during update'));
      try {
        await controller.update('1', dto);
      } catch (error) {
        expect(error).toBeInstanceOf(InternalServerErrorException);
        expect(error.message).toBe('Something went wrong during update');
      }
    });
  });

  describe('remove', () => {
    it('should remove an expense', async () => {
      expect(await controller.remove('1')).toEqual({ deleted: true });
    });
    it('should throw InternalServerErrorException if something goes wrong', async () => {
      // Simulate an internal server error in the service layer
      jest.spyOn(service, 'remove').mockRejectedValue(new InternalServerErrorException('Something went wrong during remove'));
      try {
        await controller.remove('1');
      } catch (error) {
        expect(error).toBeInstanceOf(InternalServerErrorException);
        expect(error.message).toBe('Something went wrong during remove');
      }
    });
  });
});
