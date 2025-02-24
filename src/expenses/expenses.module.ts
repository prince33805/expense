import { Module } from '@nestjs/common';
import { ExpensesService } from './expenses.service';
import { ExpensesController } from './expenses.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Expense } from './entities/expense.entity';
import { AuthModule } from '../auth/auth.module'; // Import AuthModule
import { CategoriesModule } from '../categories/categories.module';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { AuthHeaderInterceptor } from '../auth/auth-header.interceptor';
import { AuthService } from 'src/auth/auth.service';
import { Category } from 'src/categories/entities/category.entity';
import { UsersModule } from 'src/users/users.module';

@Module({
  imports: [TypeOrmModule.forFeature([Expense,Category]), AuthModule, CategoriesModule,UsersModule],
  controllers: [ExpensesController],
  providers: [
    ExpensesService,
    // AuthService,
    {
      provide: APP_INTERCEPTOR,
      useClass: AuthHeaderInterceptor,
    }
  ],
  exports: [ExpensesService],
})
export class ExpensesModule { }
