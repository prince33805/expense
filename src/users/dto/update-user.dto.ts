import { PartialType } from '@nestjs/mapped-types';
import { CreateUserDto } from './create-user.dto';
import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, MinLength } from 'class-validator';

// export class UpdateUserDto extends PartialType(CreateUserDto) {
// }
export class UpdateUserDto {
    // @ApiProperty({ example: 'user@example.com', description: 'User email' })
    // @IsNotEmpty({ message: 'Email is required' })
    // @IsEmail({}, { message: 'Invalid email format' })
    // email: string;

    @ApiProperty({ example: 'strongpassword', description: 'User password', minLength: 6 })
    @IsNotEmpty({ message: 'Password is required' })
    @MinLength(6, { message: 'Password must be at least 6 characters long' })
    password: string;
}
