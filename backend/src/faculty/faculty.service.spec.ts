import {
  beforeEach,
  describe,
  expect,
  it,
  jest,
} from '@jest/globals';
import {
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import {
  FindManyOptions,
  FindOneOptions,
  Repository,
} from 'typeorm';

import { DepartmentsService } from '../departments/departments.service.js';
import { UsersService } from '../users/users.service.js';
import { UserEntity } from '../users/entities/user.entity.js';
import { FacultyService } from './faculty.service.js';
import { FacultyEntity } from './entities/faculty.entity.js';

type FacultyRepositoryMock = {
  find: jest.MockedFunction<
    (
      options?: FindManyOptions<FacultyEntity>,
    ) => Promise<FacultyEntity[]>
  >;

  findOne: jest.MockedFunction<
    (
      options: FindOneOptions<FacultyEntity>,
    ) => Promise<FacultyEntity | null>
  >;

  create: jest.MockedFunction<
    (
      entityLike: Partial<FacultyEntity>,
    ) => FacultyEntity
  >;

  save: jest.MockedFunction<
    (
      entity: FacultyEntity,
    ) => Promise<FacultyEntity>
  >;
};

type UsersServiceMock = {
  findById: jest.MockedFunction<
    (id: string) => Promise<UserEntity | null>
  >;
};

type DepartmentsServiceMock = {
  findById: jest.MockedFunction<
    (id: string) => Promise<unknown>
  >;
};

describe('FacultyService', () => {
  let service: FacultyService;
  let repository: FacultyRepositoryMock;
  let usersService: UsersServiceMock;
  let departmentsService: DepartmentsServiceMock;

  beforeEach(() => {
    repository = {
      find: jest.fn<
        (
          options?: FindManyOptions<FacultyEntity>,
        ) => Promise<FacultyEntity[]>
      >(),

      findOne: jest.fn<
        (
          options: FindOneOptions<FacultyEntity>,
        ) => Promise<FacultyEntity | null>
      >(),

      create: jest.fn<
        (
          entityLike: Partial<FacultyEntity>,
        ) => FacultyEntity
      >(),

      save: jest.fn<
        (
          entity: FacultyEntity,
        ) => Promise<FacultyEntity>
      >(),
    };

    usersService = {
      findById: jest.fn<
        (id: string) => Promise<UserEntity | null>
      >(),
    };

    departmentsService = {
      findById: jest.fn<
        (id: string) => Promise<unknown>
      >(),
    };

    service = new FacultyService(
      repository as unknown as Repository<FacultyEntity>,
      usersService as unknown as UsersService,
      departmentsService as unknown as DepartmentsService,
    );
  });

  it('returns faculty ordered by last name and first name', async () => {
    const faculty = [
      {
        id: '1',
        userId: 'user-1',
        employeeNumber: 'EMP001',
        firstName: 'Alice',
        lastName: 'Brown',
        departmentId: 'dept-1',
      },
    ] as FacultyEntity[];

    repository.find.mockResolvedValue(faculty);

    await expect(service.findAll()).resolves.toEqual(faculty);

    expect(repository.find).toHaveBeenCalledWith({
      order: {
        lastName: 'ASC',
        firstName: 'ASC',
      },
    });
  });

  it('returns a faculty profile by id', async () => {
    const faculty = {
      id: '1',
      userId: 'user-1',
      employeeNumber: 'EMP001',
      firstName: 'Alice',
      lastName: 'Brown',
      departmentId: 'dept-1',
    } as FacultyEntity;

    repository.findOne.mockResolvedValue(faculty);

    await expect(
      service.findById('1'),
    ).resolves.toEqual(faculty);

    expect(repository.findOne).toHaveBeenCalledWith({
      where: { id: '1' },
    });
  });

  it('throws when a faculty profile does not exist', async () => {
    repository.findOne.mockResolvedValue(null);

    await expect(
      service.findById('missing'),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('creates a faculty profile for an active faculty user', async () => {
    const user = {
      id: 'user-1',
      email: 'faculty@example.com',
      passwordHash: 'hash',
      role: 'FACULTY',
      isActive: true,
    } as UserEntity;

    const faculty = {
      id: 'faculty-1',
      userId: 'user-1',
      employeeNumber: 'EMP001',
      firstName: 'Alice',
      lastName: 'Brown',
      departmentId: 'dept-1',
    } as FacultyEntity;

    usersService.findById.mockResolvedValue(user);
    repository.findOne
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce(null);
    departmentsService.findById.mockResolvedValue({
      id: 'dept-1',
    });
    repository.create.mockReturnValue(faculty);
    repository.save.mockResolvedValue(faculty);

    await expect(
      service.create({
        userId: 'user-1',
        employeeNumber: 'EMP001',
        firstName: 'Alice',
        lastName: 'Brown',
        departmentId: 'dept-1',
      }),
    ).resolves.toEqual(faculty);

    expect(usersService.findById).toHaveBeenCalledWith(
      'user-1',
    );

    expect(departmentsService.findById).toHaveBeenCalledWith(
      'dept-1',
    );

    expect(repository.create).toHaveBeenCalledWith({
      userId: 'user-1',
      employeeNumber: 'EMP001',
      firstName: 'Alice',
      lastName: 'Brown',
      departmentId: 'dept-1',
    });

    expect(repository.save).toHaveBeenCalledWith(faculty);
  });

  it('rejects creation when the user does not exist', async () => {
    usersService.findById.mockResolvedValue(null);

    await expect(
      service.create({
        userId: 'missing',
        employeeNumber: 'EMP001',
        firstName: 'Alice',
        lastName: 'Brown',
        departmentId: 'dept-1',
      }),
    ).rejects.toBeInstanceOf(NotFoundException);

    expect(repository.create).not.toHaveBeenCalled();
    expect(repository.save).not.toHaveBeenCalled();
  });

  it('rejects creation when the user is not a faculty user', async () => {
    const user = {
      id: 'user-1',
      email: 'student@example.com',
      passwordHash: 'hash',
      role: 'STUDENT',
      isActive: true,
    } as UserEntity;

    usersService.findById.mockResolvedValue(user);

    await expect(
      service.create({
        userId: 'user-1',
        employeeNumber: 'EMP001',
        firstName: 'Alice',
        lastName: 'Brown',
        departmentId: 'dept-1',
      }),
    ).rejects.toBeInstanceOf(ConflictException);

    expect(repository.create).not.toHaveBeenCalled();
    expect(repository.save).not.toHaveBeenCalled();
  });

  it('rejects creation when the faculty user is inactive', async () => {
    const user = {
      id: 'user-1',
      email: 'faculty@example.com',
      passwordHash: 'hash',
      role: 'FACULTY',
      isActive: false,
    } as UserEntity;

    usersService.findById.mockResolvedValue(user);

    await expect(
      service.create({
        userId: 'user-1',
        employeeNumber: 'EMP001',
        firstName: 'Alice',
        lastName: 'Brown',
        departmentId: 'dept-1',
      }),
    ).rejects.toBeInstanceOf(ConflictException);

    expect(repository.create).not.toHaveBeenCalled();
    expect(repository.save).not.toHaveBeenCalled();
  });

  it('rejects creation when the user already has a faculty profile', async () => {
    const user = {
      id: 'user-1',
      email: 'faculty@example.com',
      passwordHash: 'hash',
      role: 'FACULTY',
      isActive: true,
    } as UserEntity;

    const existingFaculty = {
      id: 'faculty-1',
      userId: 'user-1',
      employeeNumber: 'EMP001',
    } as FacultyEntity;

    usersService.findById.mockResolvedValue(user);
    repository.findOne.mockResolvedValue(existingFaculty);

    await expect(
      service.create({
        userId: 'user-1',
        employeeNumber: 'EMP002',
        firstName: 'Alice',
        lastName: 'Brown',
        departmentId: 'dept-1',
      }),
    ).rejects.toBeInstanceOf(ConflictException);

    expect(departmentsService.findById).not.toHaveBeenCalled();
    expect(repository.create).not.toHaveBeenCalled();
  });

  it('rejects creation when the employee number already exists', async () => {
    const user = {
      id: 'user-1',
      email: 'faculty@example.com',
      passwordHash: 'hash',
      role: 'FACULTY',
      isActive: true,
    } as UserEntity;

    const existingFaculty = {
      id: 'faculty-2',
      userId: 'user-2',
      employeeNumber: 'EMP001',
    } as FacultyEntity;

    usersService.findById.mockResolvedValue(user);
    repository.findOne
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce(existingFaculty);
    departmentsService.findById.mockResolvedValue({
      id: 'dept-1',
    });

    await expect(
      service.create({
        userId: 'user-1',
        employeeNumber: 'EMP001',
        firstName: 'Alice',
        lastName: 'Brown',
        departmentId: 'dept-1',
      }),
    ).rejects.toBeInstanceOf(ConflictException);

    expect(repository.create).not.toHaveBeenCalled();
    expect(repository.save).not.toHaveBeenCalled();
  });

  it('allows an admin to update any faculty profile', async () => {
    const faculty = {
      id: 'faculty-1',
      userId: 'user-1',
      employeeNumber: 'EMP001',
      firstName: 'Alice',
      lastName: 'Brown',
      departmentId: 'dept-1',
    } as FacultyEntity;

    const updatedFaculty = {
      ...faculty,
      employeeNumber: 'EMP002',
      firstName: 'Alicia',
      departmentId: 'dept-2',
    } as FacultyEntity;

    repository.findOne
      .mockResolvedValueOnce(faculty)
      .mockResolvedValueOnce(null);

    departmentsService.findById.mockResolvedValue({
      id: 'dept-2',
    });

    repository.save.mockResolvedValue(updatedFaculty);

    await expect(
      service.update(
        'faculty-1',
        {
          employeeNumber: 'EMP002',
          firstName: 'Alicia',
          departmentId: 'dept-2',
        },
        {
          id: 'admin-1',
          role: 'ADMIN',
        },
      ),
    ).resolves.toEqual(updatedFaculty);

    expect(departmentsService.findById).toHaveBeenCalledWith(
      'dept-2',
    );

    expect(repository.save).toHaveBeenCalledWith(faculty);
  });

  it('allows a faculty member to update their own name', async () => {
    const faculty = {
      id: 'faculty-1',
      userId: 'user-1',
      employeeNumber: 'EMP001',
      firstName: 'Alice',
      lastName: 'Brown',
      departmentId: 'dept-1',
    } as FacultyEntity;

    repository.findOne.mockResolvedValue(faculty);
    repository.save.mockResolvedValue({
      ...faculty,
      firstName: 'Alicia',
    } as FacultyEntity);

    await expect(
      service.update(
        'faculty-1',
        {
          firstName: 'Alicia',
        },
        {
          id: 'user-1',
          role: 'FACULTY',
        },
      ),
    ).resolves.toEqual({
      ...faculty,
      firstName: 'Alicia',
    });

    expect(repository.save).toHaveBeenCalledWith(faculty);
  });

  it('rejects a faculty member updating another faculty profile', async () => {
    const faculty = {
      id: 'faculty-1',
      userId: 'user-1',
      employeeNumber: 'EMP001',
      firstName: 'Alice',
      lastName: 'Brown',
      departmentId: 'dept-1',
    } as FacultyEntity;

    repository.findOne.mockResolvedValue(faculty);

    await expect(
      service.update(
        'faculty-1',
        {
          firstName: 'Changed',
        },
        {
          id: 'user-2',
          role: 'FACULTY',
        },
      ),
    ).rejects.toBeInstanceOf(ForbiddenException);

    expect(repository.save).not.toHaveBeenCalled();
  });

  it('prevents a faculty member from changing their employee number', async () => {
    const faculty = {
      id: 'faculty-1',
      userId: 'user-1',
      employeeNumber: 'EMP001',
      firstName: 'Alice',
      lastName: 'Brown',
      departmentId: 'dept-1',
    } as FacultyEntity;

    repository.findOne.mockResolvedValue(faculty);

    await expect(
      service.update(
        'faculty-1',
        {
          employeeNumber: 'EMP999',
        },
        {
          id: 'user-1',
          role: 'FACULTY',
        },
      ),
    ).rejects.toBeInstanceOf(ForbiddenException);

    expect(repository.save).not.toHaveBeenCalled();
  });

  it('prevents a faculty member from changing their department', async () => {
    const faculty = {
      id: 'faculty-1',
      userId: 'user-1',
      employeeNumber: 'EMP001',
      firstName: 'Alice',
      lastName: 'Brown',
      departmentId: 'dept-1',
    } as FacultyEntity;

    repository.findOne.mockResolvedValue(faculty);

    await expect(
      service.update(
        'faculty-1',
        {
          departmentId: 'dept-2',
        },
        {
          id: 'user-1',
          role: 'FACULTY',
        },
      ),
    ).rejects.toBeInstanceOf(ForbiddenException);

    expect(repository.save).not.toHaveBeenCalled();
  });

  it('rejects an admin update with a duplicate employee number', async () => {
    const faculty = {
      id: 'faculty-1',
      userId: 'user-1',
      employeeNumber: 'EMP001',
      firstName: 'Alice',
      lastName: 'Brown',
      departmentId: 'dept-1',
    } as FacultyEntity;

    const existingFaculty = {
      id: 'faculty-2',
      userId: 'user-2',
      employeeNumber: 'EMP002',
    } as FacultyEntity;

    repository.findOne
      .mockResolvedValueOnce(faculty)
      .mockResolvedValueOnce(existingFaculty);

    await expect(
      service.update(
        'faculty-1',
        {
          employeeNumber: 'EMP002',
        },
        {
          id: 'admin-1',
          role: 'ADMIN',
        },
      ),
    ).rejects.toBeInstanceOf(ConflictException);

    expect(repository.save).not.toHaveBeenCalled();
  });

  it('rejects an admin update with a missing department', async () => {
    const faculty = {
      id: 'faculty-1',
      userId: 'user-1',
      employeeNumber: 'EMP001',
      firstName: 'Alice',
      lastName: 'Brown',
      departmentId: 'dept-1',
    } as FacultyEntity;

    repository.findOne.mockResolvedValue(faculty);
    departmentsService.findById.mockRejectedValue(
      new NotFoundException('Department not found'),
    );

    await expect(
      service.update(
        'faculty-1',
        {
          departmentId: 'missing-dept',
        },
        {
          id: 'admin-1',
          role: 'ADMIN',
        },
      ),
    ).rejects.toBeInstanceOf(NotFoundException);

    expect(repository.save).not.toHaveBeenCalled();
  });

  it('converts a unique constraint violation into a conflict', async () => {
    const faculty = {
      id: 'faculty-1',
      userId: 'user-1',
      employeeNumber: 'EMP001',
      firstName: 'Alice',
      lastName: 'Brown',
      departmentId: 'dept-1',
    } as FacultyEntity;

    const user = {
      id: 'user-1',
      email: 'faculty@example.com',
      passwordHash: 'hash',
      role: 'FACULTY',
      isActive: true,
    } as UserEntity;

    usersService.findById.mockResolvedValue(user);
    repository.findOne
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce(null);

    departmentsService.findById.mockResolvedValue({
      id: 'dept-1',
    });

    repository.create.mockReturnValue(faculty);
    repository.save.mockRejectedValue({
      code: '23505',
    });

    await expect(
      service.create({
        userId: 'user-1',
        employeeNumber: 'EMP001',
        firstName: 'Alice',
        lastName: 'Brown',
        departmentId: 'dept-1',
      }),
    ).rejects.toBeInstanceOf(ConflictException);
  });
});
