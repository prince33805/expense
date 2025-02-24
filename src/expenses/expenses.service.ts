import { ConflictException, Inject, Injectable, InternalServerErrorException, NotFoundException, Scope, UnauthorizedException } from '@nestjs/common';
import { CreateExpenseDto } from './dto/create-expense.dto';
import { UpdateExpenseDto } from './dto/update-expense.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Between, LessThanOrEqual, MoreThanOrEqual, Repository } from 'typeorm';
import { Expense } from './entities/expense.entity';
import { Category } from '../categories/entities/category.entity';
import { REQUEST } from '@nestjs/core';
import * as jwt from 'jsonwebtoken';
import { AuthService } from 'src/auth/auth.service';
import { User } from 'src/users/entities/user.entity';

@Injectable({ scope: Scope.REQUEST }) // Makes the service request-scoped
export class ExpensesService {
  constructor(
    @InjectRepository(Expense)
    private readonly expenseRepository: Repository<Expense>,
    @InjectRepository(Category)
    private readonly categoryRepository: Repository<Category>, // Ensure InjectRepository
    @InjectRepository(User)
    private readonly userRepository: Repository<User>, // Ensure InjectRepository
    @Inject(REQUEST) private readonly request: Request,
    private readonly authService: AuthService, // Inject AuthService
  ) { }

  async create(createExpenseDto: CreateExpenseDto): Promise<Expense | null> {
    try {
      const { title, amount, date, categoryId } = createExpenseDto;

      // ✅ Use the reusable function from AuthService
      const authHeader = (this.request as any).authHeader;
      const { userId } = await this.authService.validateToken(authHeader);
      // Check if the category exists
      const category = await this.categoryRepository.findOne({ where: { id: categoryId } });
      if (!category) {
        throw new NotFoundException(`Category with ID ${categoryId} not found`);
      }

      // ✅ Create expense with a user reference
      const expense = this.expenseRepository.create({
        title,
        amount,
        date,
        category,
        user: { id: userId } as any, // ✅ Assign user as an object with ID
      });

      return await this.expenseRepository.save(expense);

    } catch (error) {
      if (error instanceof NotFoundException) throw error; // ✅ Preserve ConflictException
      throw new InternalServerErrorException('Error occurred while fetching expense');
    }
  }

  async findAll(
    page: number = 1,
    limit: number = 10,
    startDate?: string,
    endDate?: string,
    categoryId?: number
  ): Promise<any | null> {
    try {

      const authHeader = (this.request as any).authHeader;
      const { userId } = await this.authService.validateToken(authHeader);
      // Fetch the user instance from the database using the userId
      const user = await this.userRepository.findOne({ where: { id: userId } });
      if (!user) {
        throw new UnauthorizedException('User not found');
      }

      let whereConditions: any = { user: { id: userId } };
      // Add date range filter if provided
      
      if (startDate && endDate) {
        whereConditions.date = Between(startDate, endDate);
      } else if (startDate) {
        whereConditions.date = MoreThanOrEqual(startDate);
      } else if (endDate) {
        whereConditions.date = LessThanOrEqual(endDate);
      }
      // Add category filter if provided
      if (categoryId) {
        // console.log("categoryId",categoryId)
        whereConditions.category = { id: categoryId };
      }
      // Build query conditions based on filters

      console.log("whereConditions", whereConditions)
      const [expenses, total] = await this.expenseRepository.findAndCount({
        // where: { user: { id: userId } }, // Use the user ID directly in the where clause
        where: whereConditions,
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
        take: limit, // Number of users per page
        skip: (page - 1) * limit, // Offset
        order: { date: 'ASC' }, // Optional sorting by created date
      });
      // console.log("expenses", expenses)

      return {
        data: expenses,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      };
    } catch (error) {
      throw new InternalServerErrorException(error.message || 'Error occurred while fetching expense');
    }
  }

  async findOne(id: number): Promise<Expense | null> {
    try {
      const authHeader = (this.request as any).authHeader;
      const { userId } = await this.authService.validateToken(authHeader);
      // Fetch the user instance from the database using the userId
      const user = await this.userRepository.findOne({ where: { id: userId } });
      if (!user) {
        throw new UnauthorizedException('User not found');
      }

      const expense = await this.expenseRepository.findOne({
        where: { id, user: { id: userId } },
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
      if (!expense) {
        throw new NotFoundException(`Expenexpense with ID ${id} and user ID ${userId} not found`);
      }
      return expense
    } catch (error) {
      if (error instanceof NotFoundException) throw error
      throw new InternalServerErrorException('Error occurred while fetching expense');
    }
  }

  async update(id: number, updateExpenseDto: UpdateExpenseDto): Promise<Expense | null> {
    try {
      const authHeader = (this.request as any).authHeader;
      const { userId } = await this.authService.validateToken(authHeader);
      // Fetch the user instance from the database using the userId
      const user = await this.userRepository.findOne({ where: { id: userId } });
      if (!user) {
        throw new UnauthorizedException('User not found');
      }

      // Find the existing expense, and include the related category
      const expense = await this.expenseRepository.findOne({
        where: { id, user: { id: userId } },
        // relations: ['category'],
      });

      // Handle case where expense is not found
      if (!expense) {
        throw new NotFoundException(`Expense with ID ${id} and user ID ${userId} not found`);
      }

      // If categoryId is provided, validate the category
      if (updateExpenseDto.categoryId) {
        const existingCategory = await this.categoryRepository.findOne({
          where: { id: updateExpenseDto.categoryId },
        });

        // Handle case where category does not exist
        if (!existingCategory) {
          throw new NotFoundException(`Category with ID ${updateExpenseDto.categoryId} not found`);
        }

        // Update category in the updated data
        expense.category = existingCategory;
      }

      // Update the other fields in the expense
      expense.title = updateExpenseDto.title || expense.title;
      expense.amount = updateExpenseDto.amount || expense.amount;
      expense.date = updateExpenseDto.date || expense.date;

      // Save the updated expense to the repository
      await this.expenseRepository.save(expense);

      // Return the updated expense entity
      return this.expenseRepository.findOne({
        where: { id },
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
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      throw new InternalServerErrorException('Error occurred while fetching expense');
    }
  }

  async remove(id: number): Promise<{ message: string } | null> {
    try {

      const authHeader = (this.request as any).authHeader;
      const { userId } = await this.authService.validateToken(authHeader);
      // Fetch the user instance from the database using the userId
      const user = await this.userRepository.findOne({ where: { id: userId } });
      if (!user) {
        throw new UnauthorizedException('User not found');
      }

      const expense = await this.expenseRepository.findOne({ where: { id, user: { id: userId } } });
      if (!expense) {
        throw new NotFoundException(`Expense with ID ${id} and user ID ${userId} not found`);
      }
      await this.expenseRepository.softRemove(expense);
      return { message: `Expense with ID ${id} has been soft deleted` };
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      throw new InternalServerErrorException('Error occurred while fetching expense');
    }
  }

  async generateReport(
    startDate: string, 
    endDate: string
  ): Promise<any> {
    try {
      // Retrieve the auth header and validate the token
      const authHeader = (this.request as any).authHeader;
      const { userId } = await this.authService.validateToken(authHeader);
      // console.log("userId",userId)
      // Fetch expenses grouped by category and sum total expenses for each category
      const report = await this.expenseRepository
        .createQueryBuilder('expense')
        .select('category.id', 'categoryId')
        .addSelect('category.name', 'categoryName')
        .addSelect('SUM(expense.amount)', 'totalAmount')
        .innerJoin('expense.category', 'category')
        .where('expense.userId = :userId', { userId })
        .andWhere('expense.date BETWEEN :startDate AND :endDate', { startDate, endDate })
        .groupBy('category.id')
        .addGroupBy('category.name')
        .getRawMany();
  
      // If no data, return a meaningful message
      if (!report || report.length === 0) {
        throw new NotFoundException('No expenses found for the given date range');
      }
  
      // Return the report
      return report;
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      throw new InternalServerErrorException(error.message || 'Error occurred while generating the report');
    }
  }
  
}
