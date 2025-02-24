import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString, MinLength } from 'class-validator';

export class CreateCategoryDto {
    @ApiProperty({ example: 'category name', description: 'category name' })
    @IsNotEmpty({ message: 'Category name is required' })
    @IsString({ message: 'Invalid string format' })
    name: string;
}
