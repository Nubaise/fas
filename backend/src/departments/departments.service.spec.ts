import {
  beforeEach,
  describe,
  expect,
  it,
  jest,
} from '@jest/globals';
import { ConflictException, NotFoundException } from '@nestjs/common';
import {
  FindManyOptions,
  FindOneOptions,
  Repository,
} from 'typeorm';

import { DepartmentsService } from './departments.service.js';
import { DepartmentEntity } from './entities/department.entity.js';

type DepartmentRepositoryMock = {
  find: jest.MockedFunction<
    (
      options?: FindManyOptions<DepartmentEntity>,
    ) => Promise<DepartmentEntity[]>
  >;

  findOne: jest.MockedFunction<
    (
      options: FindOneOptions<DepartmentEntity>,
    ) => Promise<DepartmentEntity | null>
  >;

  create: jest.MockedFunction<
    (
      entityLike: Partial<DepartmentEntity>,
    ) => DepartmentEntity
  >;

  save: jest.MockedFunction<
    (
      entity: DepartmentEntity,
    ) => Promise<DepartmentEntity>
  >;

  remove: jest.MockedFunction<
    (
      entity: DepartmentEntity,
    ) => Promise<DepartmentEntity>
  >;
};

describe('DepartmentsService', () => {
  let service: DepartmentsService;
  let repository: DepartmentRepositoryMock;

  beforeEach(() => {
    repository = {
      find: jest.fn<
        (
          options?: FindManyOptions<DepartmentEntity>,
        ) => Promise<DepartmentEntity[]>
      >(),

      findOne: jest.fn<
        (
          options: FindOneOptions<DepartmentEntity>,
        ) => Promise<DepartmentEntity | null>
      >(),

      create: jest.fn<
        (
          entityLike: Partial<DepartmentEntity>,
        ) => DepartmentEntity
      >(),

      save: jest.fn<
        (
          entity: DepartmentEntity,
        ) => Promise<DepartmentEntity>
      >(),

      remove: jest.fn<
        (
          entity: DepartmentEntity,
        ) => Promise<DepartmentEntity>
      >(),
    };

    service = new DepartmentsService(
      repository as unknown as Repository<DepartmentEntity>,
    );
  });

  it('returns departments ordered by name', async () => {
    const departments = [
      {
        id: '1',
        name: 'Computer Science',
        code: 'CS',
      },
    ] as DepartmentEntity[];

    repository.find.mockResolvedValue(departments);

    await expect(service.findAll()).resolves.toEqual(departments);

    expect(repository.find).toHaveBeenCalledWith({
      order: { name: 'ASC' },
    });
  });

  it('returns a department by id', async () => {
    const department = {
      id: '1',
      name: 'Computer Science',
      code: 'CS',
    } as DepartmentEntity;

    repository.findOne.mockResolvedValue(department);

    await expect(service.findById('1')).resolves.toEqual(department);

    expect(repository.findOne).toHaveBeenCalledWith({
      where: { id: '1' },
    });
  });

  it('throws when a department does not exist', async () => {
    repository.findOne.mockResolvedValue(null);

    await expect(
      service.findById('missing'),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('creates a department', async () => {
    const department = {
      id: '1',
      name: 'Computer Science',
      code: 'CS',
    } as DepartmentEntity;

    repository.findOne.mockResolvedValue(null);
    repository.create.mockReturnValue(department);
    repository.save.mockResolvedValue(department);

    await expect(
      service.create({
        name: 'Computer Science',
        code: 'CS',
      }),
    ).resolves.toEqual(department);

    expect(repository.findOne).toHaveBeenCalledWith({
      where: [
        { name: 'Computer Science' },
        { code: 'CS' },
      ],
    });

    expect(repository.create).toHaveBeenCalledWith({
      name: 'Computer Science',
      code: 'CS',
    });

    expect(repository.save).toHaveBeenCalledWith(department);
  });

  it('rejects a duplicate department name', async () => {
    const existingDepartment = {
      id: '1',
      name: 'Computer Science',
      code: 'CS',
    } as DepartmentEntity;

    repository.findOne.mockResolvedValue(existingDepartment);

    await expect(
      service.create({
        name: 'Computer Science',
        code: 'CSE',
      }),
    ).rejects.toBeInstanceOf(ConflictException);

    expect(repository.create).not.toHaveBeenCalled();
    expect(repository.save).not.toHaveBeenCalled();
  });

  it('rejects a duplicate department code', async () => {
    const existingDepartment = {
      id: '1',
      name: 'Computer Science',
      code: 'CS',
    } as DepartmentEntity;

    repository.findOne.mockResolvedValue(existingDepartment);

    await expect(
      service.create({
        name: 'Engineering',
        code: 'CS',
      }),
    ).rejects.toBeInstanceOf(ConflictException);

    expect(repository.create).not.toHaveBeenCalled();
    expect(repository.save).not.toHaveBeenCalled();
  });

  it('updates a department', async () => {
    const department = {
      id: '1',
      name: 'Computer Science',
      code: 'CS',
    } as DepartmentEntity;

    const updatedDepartment = {
      ...department,
      name: 'Computing',
    } as DepartmentEntity;

    repository.findOne
      .mockResolvedValueOnce(department)
      .mockResolvedValueOnce(null);

    repository.save.mockResolvedValue(updatedDepartment);

    await expect(
      service.update('1', {
        name: 'Computing',
      }),
    ).resolves.toEqual(updatedDepartment);

    expect(repository.save).toHaveBeenCalledWith(department);
    expect(department.name).toBe('Computing');
  });

  it('rejects updating to an existing department name', async () => {
    const department = {
      id: '1',
      name: 'Computer Science',
      code: 'CS',
    } as DepartmentEntity;

    const existingDepartment = {
      id: '2',
      name: 'Engineering',
      code: 'ENG',
    } as DepartmentEntity;

    repository.findOne
      .mockResolvedValueOnce(department)
      .mockResolvedValueOnce(existingDepartment);

    await expect(
      service.update('1', {
        name: 'Engineering',
      }),
    ).rejects.toBeInstanceOf(ConflictException);

    expect(repository.save).not.toHaveBeenCalled();
  });

  it('deletes a department', async () => {
    const department = {
      id: '1',
      name: 'Computer Science',
      code: 'CS',
    } as DepartmentEntity;

    repository.findOne.mockResolvedValue(department);
    repository.remove.mockResolvedValue(department);

    await expect(
      service.remove('1'),
    ).resolves.toBeUndefined();

    expect(repository.findOne).toHaveBeenCalledWith({
      where: { id: '1' },
    });

    expect(repository.remove).toHaveBeenCalledWith(department);
  });

  it('converts a foreign-key violation into a conflict', async () => {
    const department = {
      id: '1',
      name: 'Computer Science',
      code: 'CS',
    } as DepartmentEntity;

    repository.findOne.mockResolvedValue(department);
    repository.remove.mockRejectedValue({
      code: '23503',
    });

    await expect(
      service.remove('1'),
    ).rejects.toBeInstanceOf(ConflictException);

    expect(repository.remove).toHaveBeenCalledWith(department);
  });
});
