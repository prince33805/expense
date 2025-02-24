import { ConflictException, Injectable, InternalServerErrorException, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../users/entities/user.entity';
import { JwtService } from '@nestjs/jwt';
import { RegisterDto } from './dto/auth.dto';
import * as jwt from 'jsonwebtoken';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly jwtService: JwtService,
  ) { }

  async register(registerDto: RegisterDto): Promise<User | null> {
    try {
      const existingUser = await this.findUserByEmail(registerDto.email);
      if (existingUser) {
        throw new ConflictException('Email already in use'); // Throw a ConflictException if email exists
      }

      const user = new User();
      user.email = registerDto.email;
      user.password = registerDto.password;
      user.createdAt = new Date(); // Ensure timestamps are set
      user.updatedAt = new Date();
      user.deletedAt = null;
      await user.hashPassword(); // Hash password before saving

      return await this.userRepository.save(user);
    } catch (error) {
      if (error instanceof ConflictException) throw error; // ✅ Preserve ConflictException
      throw new InternalServerErrorException('Error occurred while registering user');
    }
  }

  async login(email: string, password: string): Promise<{ access_token: string } | null> {
    try {
      const user = await this.findUserByEmail(email);
      if (!user) {
        throw new UnauthorizedException('Invalid credentials');
      }

      const isPasswordValid = await user.validatePassword(password)
      if (!isPasswordValid) {
        throw new UnauthorizedException('Invalid password credentials');
      }

      const payload = { sub: user.id, email: user.email };
      return {
        access_token: this.jwtService.sign(payload),
      };
    } catch (error) {
      if (error instanceof UnauthorizedException) throw error; // ✅ Preserve ConflictException
      throw new InternalServerErrorException(error.message || 'Login failed');
    }
  }

  async validateUser(userId: number): Promise<User | null> {
    try {
      return await this.userRepository.findOne({ where: { id: userId } });
    } catch (error) {
      throw new InternalServerErrorException('Error occurred while fetching user');
    }
  }

  async findUserByEmail(email: string): Promise<User | null> {
    try {
      return await this.userRepository.findOne({ where: { email } });
    } catch (error) {
      throw new InternalServerErrorException('Error occurred while fetching user');
    }
  }

  async validateToken(authHeader: string): Promise<{ userId: number }> {
    if (!authHeader) {
      throw new UnauthorizedException('Authorization header missing');
    }

    // Extract and verify the token
    const token = authHeader.replace('Bearer ', '');
    const secret = process.env.JWT_SECRET;
    if (!secret) {
      throw new InternalServerErrorException('JWT secret not set in environment variables');
    }

    let decoded: any;
    try {
      decoded = jwt.verify(token, secret);
    } catch (error) {
      throw new UnauthorizedException('Invalid or expired token');
    }

    // Ensure the token contains the user ID
    if (!decoded?.sub) {
      throw new UnauthorizedException('Invalid token payload: Missing user identifier');
    }

    return { userId: decoded.sub }; // Return only necessary info
  }

}
