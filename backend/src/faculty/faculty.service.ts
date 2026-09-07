import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import * as argon2 from 'argon2';
import { DataSource, Repository } from 'typeorm';

import { DepartmentsService } from '../departments/departments.service.js';
import { UserEntity } from '../users/entities/user.entity.js';
import { UsersService } from '../users/users.service.js';
import type {
  BulkOnboardFacultyDto,
} from './dto/bulk-onboard-faculty.dto.js';
import type {
  OnboardFacultyDto,
} from './dto/onboard-faculty.dto.js';
import type {
  CreateFacultyDto,
  UpdateFacultyDto,
} from './dto/faculty.dto.js';
import { FacultyEntity } from './entities/faculty.entity.js';

type CurrentUser = {
  id: string;
  role: 'STUDENT' | 'FACULTY' | 'ADMIN';
};

export type BulkOnboardFacultyResult = {
  successful: FacultyEntity[];
  failed: Array<{
    row: number;
    email: string;
    employeeNumber: string;
    message: string;
  }>;
};

@Injectable()
export class FacultyService {
  constructor(
    @InjectRepository(FacultyEntity)
    private readonly facultyRepository: Repository<FacultyEntity>,
    private readonly usersService: UsersService,
    private readonly departmentsService: DepartmentsService,
    private readonly dataSource: DataSource,
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

  async onboard(
    data: OnboardFacultyDto,
  ): Promise<FacultyEntity> {
    await this.departmentsService.findById(
      data.departmentId,
    );

    const existingUser = await this.usersService.findByEmail(
      data.email,
    );

    if (existingUser) {
      throw new ConflictException(
        'User with this email already exists',
      );
    }

    const existingEmployee =
      await this.facultyRepository.findOne({
        where: {
          employeeNumber: data.employeeNumber,
        },
      });

    if (existingEmployee) {
      throw new ConflictException(
        'Employee number already exists',
      );
    }

    const passwordHash = await argon2.hash(data.password);

    try {
      return await this.dataSource.transaction(
        async (manager) => {
          const user = manager.create(UserEntity, {
            email: data.email,
            passwordHash,
            role: 'FACULTY',
            isActive: true,
          });

          const savedUser = await manager.save(user);

          const faculty = manager.create(FacultyEntity, {
            userId: savedUser.id,
            employeeNumber: data.employeeNumber,
            firstName: data.firstName,
            lastName: data.lastName,
            departmentId: data.departmentId,
          });

          return manager.save(faculty);
        },
      );
    } catch (error) {
      if (this.isUniqueViolation(error)) {
        throw new ConflictException(
          'User email or employee number already exists',
        );
      }

      throw error;
    }
  }

  async bulkOnboard(
    data: BulkOnboardFacultyDto,
  ): Promise<BulkOnboardFacultyResult> {
    const successful: FacultyEntity[] = [];
    const failed: BulkOnboardFacultyResult['failed'] = [];

    const seenEmails = new Set<string>();
    const seenEmployeeNumbers = new Set<string>();

    for (const [index, item] of data.faculty.entries()) {
      const row = index + 1;
      const email = item.email.trim().toLowerCase();
      const employeeNumber = item.employeeNumber.trim();

      if (seenEmails.has(email)) {
        failed.push({
          row,
          email: item.email,
          employeeNumber,
          message: 'Duplicate email in import',
        });
        continue;
      }

      if (seenEmployeeNumbers.has(employeeNumber)) {
        failed.push({
          row,
          email: item.email,
          employeeNumber,
          message: 'Duplicate employee number in import',
        });
        continue;
      }

      seenEmails.add(email);
      seenEmployeeNumbers.add(employeeNumber);

      try {
        await this.departmentsService.findById(item.departmentId);

        const existingUser = await this.usersService.findByEmail(email);

        if (existingUser) {
          throw new ConflictException(
            'User with this email already exists',
          );
        }

        const existingEmployee =
          await this.facultyRepository.findOne({
            where: {
              employeeNumber,
            },
          });

        if (existingEmployee) {
          throw new ConflictException(
            'Employee number already exists',
          );
        }

        const faculty = await this.dataSource.transaction(
          async (manager) => {
            const passwordHash = await argon2.hash(
              item.password,
            );

            const user = manager.create(UserEntity, {
              email,
              passwordHash,
              role: 'FACULTY',
              isActive: true,
            });

            const savedUser = await manager.save(user);

            const facultyEntity = manager.create(FacultyEntity, {
              userId: savedUser.id,
              employeeNumber,
              firstName: item.firstName.trim(),
              lastName: item.lastName.trim(),
              departmentId: item.departmentId,
            });

            return manager.save(facultyEntity);
          },
        );

        successful.push(faculty);
      } catch (error) {
        failed.push({
          row,
          email: item.email,
          employeeNumber,
          message: this.getBulkErrorMessage(error),
        });
      }
    }

    return {
      successful,
      failed,
    };
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

  private getBulkErrorMessage(error: unknown): string {
    if (
      error instanceof ConflictException ||
      error instanceof NotFoundException
    ) {
      const response = error.getResponse();

      if (
        typeof response === 'object' &&
        response !== null &&
        'message' in response &&
        typeof response.message === 'string'
      ) {
        return response.message;
      }

      if (typeof response === 'string') {
        return response;
      }
    }

    return 'Unable to onboard faculty';
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
