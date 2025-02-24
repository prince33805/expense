import { Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { AuthHeaderInterceptor } from '../auth/auth-header.interceptor';
import { AuthModule } from '../auth/auth.module'; // Import AuthModule

@Module({
  imports: [TypeOrmModule.forFeature([User]), AuthModule],
  providers: [
    UsersService,
    {
      provide: APP_INTERCEPTOR,
      useClass: AuthHeaderInterceptor,
    }],
  controllers: [UsersController],
  exports: [UsersService, TypeOrmModule],  // Export so AuthModule can use it
})
export class UsersModule { }
