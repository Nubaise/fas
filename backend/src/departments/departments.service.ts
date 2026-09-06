import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { DepartmentEntity } from './entities/department.entity.js';
import type {
  CreateDepartmentDto,
  UpdateDepartmentDto,
} from './dto/department.dto.js';

@Injectable()
export class DepartmentsService {
  constructor(
    @InjectRepository(DepartmentEntity)
    private readonly departmentsRepository: Repository<DepartmentEntity>,
  ) {}

  async findAll(): Promise<DepartmentEntity[]> {
    return this.departmentsRepository.find({
      order: { name: 'ASC' },
    });
  }

  async findById(id: string): Promise<DepartmentEntity> {
    const department = await this.departmentsRepository.findOne({
      where: { id },
    });

    if (!department) {
      throw new NotFoundException('Department not found');
    }

    return department;
  }

  async create(data: CreateDepartmentDto): Promise<DepartmentEntity> {
    const existing = await this.departmentsRepository.findOne({
      where: [{ name: data.name }, { code: data.code }],
    });

    if (existing) {
      throw new ConflictException(
        existing.name === data.name
          ? 'Department name already exists'
          : 'Department code already exists',
      );
    }

    const department = this.departmentsRepository.create({
      name: data.name,
      code: data.code,
    });

    try {
      return await this.departmentsRepository.save(department);
    } catch (error) {
      if (this.isUniqueViolation(error)) {
        throw new ConflictException(
          'Department name or code already exists',
        );
      }

      throw error;
    }
  }

  async update(
    id: string,
    data: UpdateDepartmentDto,
  ): Promise<DepartmentEntity> {
    const department = await this.findById(id);

    if (data.name !== undefined && data.name !== department.name) {
      const existing = await this.departmentsRepository.findOne({
        where: { name: data.name },
      });

      if (existing && existing.id !== id) {
        throw new ConflictException('Department name already exists');
      }
    }

    if (data.code !== undefined && data.code !== department.code) {
      const existing = await this.departmentsRepository.findOne({
        where: { code: data.code },
      });

      if (existing && existing.id !== id) {
        throw new ConflictException('Department code already exists');
      }
    }

    Object.assign(department, data);

    try {
      return await this.departmentsRepository.save(department);
    } catch (error) {
      if (this.isUniqueViolation(error)) {
        throw new ConflictException(
          'Department name or code already exists',
        );
      }

      throw error;
    }
  }

  async remove(id: string): Promise<void> {
    const department = await this.findById(id);

    try {
      await this.departmentsRepository.remove(department);
    } catch (error) {
      if (this.isForeignKeyViolation(error)) {
        throw new ConflictException(
          'Department cannot be deleted while it has dependent records',
        );
      }

      throw error;
    }
  }

  private isUniqueViolation(error: unknown): boolean {
    return (
      typeof error === 'object' &&
      error !== null &&
      'code' in error &&
      error.code === '23505'
    );
  }

  private isForeignKeyViolation(error: unknown): boolean {
    return (
      typeof error === 'object' &&
      error !== null &&
      'code' in error &&
      error.code === '23503'
    );
  }
}
