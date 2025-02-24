import { Injectable, Scope, InternalServerErrorException, NotFoundException, UnauthorizedException, Inject } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from '../users/entities/user.entity';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import * as jwt from 'jsonwebtoken';
import { REQUEST } from '@nestjs/core';
import { AuthService } from 'src/auth/auth.service';

@Injectable({ scope: Scope.REQUEST }) // Makes the service request-scoped
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @Inject(REQUEST) private readonly request: Request,
    private readonly authService: AuthService, // Inject AuthService
    // private readonly jwtService: JwtService,
  ) { }

  // create(createUserDto: CreateUserDto) {
  //   return 'This action adds a new user';
  // }

  async findAllUsers(page: number = 1, limit: number = 10): Promise<any | null> {
    try {
      const [users, total] = await this.userRepository.findAndCount({
        take: limit, // Number of users per page
        skip: (page - 1) * limit, // Offset
        order: { createdAt: 'ASC' }, // Optional sorting by created date
      });

      return {
        data: users,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      };
    } catch (error) {
      throw new InternalServerErrorException(error.message || 'Error occurred while fetching users');
    }
  }

  async findOne(id: number): Promise<User | null> {
    try {
      const user = await this.userRepository.findOne({ where: { id } });
      if (!user) {
        throw new NotFoundException(`User with ID ${id} not found`);
      }
      return user
    } catch (error) {
      if (error instanceof NotFoundException) throw error
      throw new InternalServerErrorException('Error occurred while fetching user');
    }
  }

  // token: string
  async update(id: number, updateUserDto: UpdateUserDto): Promise<User | null> {
    try {

      const authHeader = (this.request as any).authHeader;
      const { userId } = await this.authService.validateToken(authHeader);
      // Fetch the user instance from the database using the userId
      const user = await this.userRepository.findOne({ where: { id: id } });
      if (!user) {
        throw new UnauthorizedException('User not found');
      }
      // const secret = process.env.JWT_SECRET || 'default_secret';
      // // console.log("secret", secret)
      // const decoded: any = jwt.verify(token, secret);

      // const user = await this.userRepository.findOne({ where: { id } });
      // if (!user) {
      //   throw new NotFoundException(`User with ID ${id} not found`);
      // }
      // Check if the user ID from token matches the requested ID
      if (userId !== user.id) {
        throw new UnauthorizedException('You are not allowed to update this user');
      }

      // Check if password needs hashing before saving
      if (updateUserDto.password) {
        updateUserDto.password = await bcrypt.hash(updateUserDto.password, 10);
      }

      // Update and save user
      await this.userRepository.update(id, updateUserDto);
      return this.userRepository.findOne({ where: { id } }); // Return updated user
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof UnauthorizedException) {
        throw error;
      }
      throw new InternalServerErrorException('Error occurred while fetching user');
    }
  }

  async remove(id: number): Promise<{ message: string } | null> {
    try {

      // const token = req.headers.authorization?.replace('Bearer ', '');
      // return token
      // Verify and decode JWT token
      const authHeader = (this.request as any).authHeader;
      const { userId } = await this.authService.validateToken(authHeader);
      // Fetch the user instance from the database using the userId
      const user = await this.userRepository.findOne({ where: { id: id } });
      if (!user) {
        throw new UnauthorizedException('User not found');
      }

      // Ensure the token owner is the same as the user being deleted
      if (userId !== user.id) {
        throw new UnauthorizedException('You are not allowed to delete this user');
      }

      await this.userRepository.softRemove(user);
      return { message: `User with ID ${id} has been soft deleted` };
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof UnauthorizedException) {
        throw error;
      }
      throw new InternalServerErrorException('Error occurred while fetching user');
    }
  }
}
