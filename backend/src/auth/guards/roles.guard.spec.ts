import {
  beforeEach,
  describe,
  expect,
  it,
  jest,
} from '@jest/globals';
import { ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';

import { RolesGuard } from './roles.guard.js';

describe('RolesGuard', () => {
  let reflector: Reflector;
  let guard: RolesGuard;

  beforeEach(() => {
    reflector = new Reflector();
    guard = new RolesGuard(reflector);
  });

  it('allows access when no roles are required', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(
      undefined,
    );

    const context = {
        getHandler: () => undefined,
        getClass: () => undefined,
    } as unknown as ExecutionContext;

    expect(guard.canActivate(context)).toBe(true);
  });

  it('allows access when the user has a required role', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue([
      'ADMIN',
    ]);

    const context = {
      getHandler: () => undefined,
      getClass: () => undefined,
      switchToHttp: () => ({
        getRequest: () => ({
          user: {
            id: 'admin-id',
            role: 'ADMIN',
          },
        }),
      }),
    } as unknown as ExecutionContext;

    expect(guard.canActivate(context)).toBe(true);
  });

  it('rejects access when the user does not have a required role', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue([
      'ADMIN',
    ]);

    const context = {
      getHandler: () => undefined,
      getClass: () => undefined,
      switchToHttp: () => ({
        getRequest: () => ({
          user: {
            id: 'student-id',
            role: 'STUDENT',
          },
        }),
      }),
    } as unknown as ExecutionContext;

    expect(() => guard.canActivate(context)).toThrow(
      'Insufficient permissions',
    );
  });

  it('rejects access when no authenticated user exists', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue([
      'ADMIN',
    ]);

    const context = {
      getHandler: () => undefined,
      getClass: () => undefined,
      switchToHttp: () => ({
        getRequest: () => ({}),
      }),
    } as unknown as ExecutionContext;

    expect(() => guard.canActivate(context)).toThrow(
      'Insufficient permissions',
    );
  });
});
