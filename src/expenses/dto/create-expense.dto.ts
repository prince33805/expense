import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsDate, IsEmail, IsNotEmpty, IsNumber, IsPositive, IsString, MinLength } from 'class-validator';

export class CreateExpenseDto {
    @ApiProperty({ example: 'expense title', description: 'expense title' })
    @IsNotEmpty({ message: 'expense title is required' })
    @IsString({ message: 'Invalid string format' })
    title: string;

    @ApiProperty({ example: 'expense amount', description: 'expense amount' })
    @IsNotEmpty({ message: 'expense amount is required' })
    @IsNumber({}, { message: 'Amount must be a number.' })
    @IsPositive({ message: 'Amount must be a positive number.' })
    amount: number;

    @ApiProperty({ example: 'expense date', description: 'expense date' })
    @Type(() => Date) // Ensure it's converted to a Date instance
    @IsNotEmpty({ message: 'expense date is required' })
    @IsDate({ message: 'Invalid date format. Use YYYY-MM-DD.' })
    date: Date;

    @ApiProperty({ example: 'expense title', description: 'expense title' })
    @IsNotEmpty({ message: 'expense title is required' })
    // @IsString({ message: 'Invalid string format' })
    @IsNumber({}, { message: 'Category ID must be a number.' })
    categoryId: number;
}
