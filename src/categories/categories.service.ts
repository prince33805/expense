import { ConflictException, Injectable, InternalServerErrorException, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Category } from './entities/category.entity';
import { Repository } from 'typeorm';

@Injectable()
export class CategoriesService {
  constructor(
    @InjectRepository(Category)
    private readonly categoryRepository: Repository<Category>,
    // private readonly jwtService: JwtService,
  ) { }

  async create(createCategoryDto: CreateCategoryDto): Promise<Category | null> {
    try {
      const categoryName = createCategoryDto.name.toLowerCase()
      const existingCategory = await this.categoryRepository.findOne({ where: { name: categoryName } });
      if (existingCategory) {
        throw new ConflictException('Category already in use'); // Throw a ConflictException if email exists
      }
      const category = this.categoryRepository.create({ name: categoryName })
      return await this.categoryRepository.save(category);
    } catch (error) {
      if (error instanceof ConflictException) throw error; // ✅ Preserve ConflictException
      throw new InternalServerErrorException('Error occurred while fetching category');
    }
  }

  async findAll(page: number = 1, limit: number = 10): Promise<any | null> {
    try {
      const [categories, total] = await this.categoryRepository.findAndCount({
        take: limit, // Number of users per page
        skip: (page - 1) * limit, // Offset
        order: { createdAt: 'ASC' }, // Optional sorting by created date
      });

      return {
        data: categories,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      };
    } catch (error) {
      throw new InternalServerErrorException(error.message || 'Error occurred while fetching categories');
    }
  }

  async findOne(id: number): Promise<Category | null> {
    try {
      const category = await this.categoryRepository.findOne({ where: { id } });
      if (!category) {
        throw new NotFoundException(`Category with ID ${id} not found`);
      }
      return category
    } catch (error) {
      if (error instanceof NotFoundException) throw error
      throw new InternalServerErrorException('Error occurred while fetching category');
    }
  }

  async update(id: number, updateCategoryDto: UpdateCategoryDto): Promise<Category | null> {
    try {
      const category = await this.categoryRepository.findOne({ where: { id } });
      if (!category) {
        throw new NotFoundException(`Category with ID ${id} not found`);
      }
      const categoryName = updateCategoryDto.name.toLowerCase()
      if (categoryName === category.name) {
        return category
      }
      // Step 2: Check for duplicates (by the name, converted to lowercase)
      const existingCategory = await this.categoryRepository.findOne({
        where: { name: categoryName },
      });

      if (existingCategory && existingCategory.id !== id) {
        throw new ConflictException(`Category with the name '${categoryName}' already exists`);
      }

      category.name = categoryName
      // Update and save user
      await this.categoryRepository.update(id, { name: categoryName });
      return this.categoryRepository.findOne({ where: { id } }); // Return updated user
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof ConflictException) {
        throw error;
      }
      throw new InternalServerErrorException('Error occurred while fetching category');
    }
  }

  async remove(id: number): Promise<{ message: string } | null> {
    try {
      const category = await this.categoryRepository.findOne({ where: { id } });
      if (!category) {
        throw new NotFoundException(`Category with ID ${id} not found`);
      }
      await this.categoryRepository.softRemove(category);
      return { message: `Category with ID ${id} has been soft deleted` };
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      throw new InternalServerErrorException('Error occurred while fetching category');
    }
  }
}
