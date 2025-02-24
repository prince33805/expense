// import { PartialType } from '@nestjs/mapped-types';
// import { CreateCategoryDto } from './create-category.dto';
import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString } from 'class-validator';

export class UpdateCategoryDto {
    @ApiProperty({ example: 'category name', description: 'category name' })
    @IsNotEmpty({ message: 'Category name is required' })
    @IsString({ message: 'Invalid string format' })
    name: string;
}
