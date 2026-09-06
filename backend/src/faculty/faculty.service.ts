import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { DepartmentsService } from '../departments/departments.service.js';
import { UsersService } from '../users/users.service.js';
import type {
  CreateFacultyDto,
  UpdateFacultyDto,
} from './dto/faculty.dto.js';
import { FacultyEntity } from './entities/faculty.entity.js';

type CurrentUser = {
  id: string;
  role: 'STUDENT' | 'FACULTY' | 'ADMIN';
};

@Injectable()
export class FacultyService {
  constructor(
    @InjectRepository(FacultyEntity)
    private readonly facultyRepository: Repository<FacultyEntity>,
    private readonly usersService: UsersService,
    private readonly departmentsService: DepartmentsService,
  ) {}

  async findAll(): Promise<FacultyEntity[]> {
    return this.facultyRepository.find({
      order: {
        lastName: 'ASC',
        firstName: 'ASC',
      },
    });
  }

  async findById(id: string): Promise<FacultyEntity> {
    const faculty = await this.facultyRepository.findOne({
      where: { id },
    });

    if (!faculty) {
      throw new NotFoundException('Faculty not found');
    }

    return faculty;
  }

  async create(data: CreateFacultyDto): Promise<FacultyEntity> {
    const user = await this.usersService.findById(data.userId);

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (user.role !== 'FACULTY') {
      throw new ConflictException(
        'User must have FACULTY role',
      );
    }

    if (!user.isActive) {
      throw new ConflictException(
        'User must be active',
      );
    }

    const existingFaculty = await this.facultyRepository.findOne({
      where: { userId: data.userId },
    });

    if (existingFaculty) {
      throw new ConflictException(
        'Faculty profile already exists for this user',
      );
    }

    await this.departmentsService.findById(data.departmentId);

    const existingEmployee = await this.facultyRepository.findOne({
      where: {
        employeeNumber: data.employeeNumber,
      },
    });

    if (existingEmployee) {
      throw new ConflictException(
        'Employee number already exists',
      );
    }

    const faculty = this.facultyRepository.create({
      userId: data.userId,
      employeeNumber: data.employeeNumber,
      firstName: data.firstName,
      lastName: data.lastName,
      departmentId: data.departmentId,
    });

    try {
      return await this.facultyRepository.save(faculty);
    } catch (error) {
      if (this.isUniqueViolation(error)) {
        throw new ConflictException(
          'Employee number or faculty profile already exists',
        );
      }

      throw error;
    }
  }

  async update(
    id: string,
    data: UpdateFacultyDto,
    currentUser: CurrentUser,
  ): Promise<FacultyEntity> {
    const faculty = await this.findById(id);

    const isAdmin = currentUser.role === 'ADMIN';

    if (!isAdmin && faculty.userId !== currentUser.id) {
      throw new ForbiddenException(
        'You can only update your own faculty profile',
      );
    }

    if (!isAdmin) {
      if (
        data.employeeNumber !== undefined ||
        data.departmentId !== undefined
      ) {
        throw new ForbiddenException(
          'Faculty members can only update their name',
        );
      }
    }

    if (
      data.employeeNumber !== undefined &&
      data.employeeNumber !== faculty.employeeNumber
    ) {
      const existingEmployee = await this.facultyRepository.findOne({
        where: {
          employeeNumber: data.employeeNumber,
        },
      });

      if (
        existingEmployee &&
        existingEmployee.id !== faculty.id
      ) {
        throw new ConflictException(
          'Employee number already exists',
        );
      }
    }

    if (data.departmentId !== undefined) {
      await this.departmentsService.findById(
        data.departmentId,
      );
    }

    Object.assign(faculty, data);

    try {
      return await this.facultyRepository.save(faculty);
    } catch (error) {
      if (this.isUniqueViolation(error)) {
        throw new ConflictException(
          'Employee number already exists',
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
}
