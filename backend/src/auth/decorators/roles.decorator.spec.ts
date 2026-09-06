import { describe, expect, it } from '@jest/globals';
import { Reflector } from '@nestjs/core';

import { ROLES_KEY, Roles } from './roles.decorator.js';
import type { Role } from '../types/role.type.js';

describe('Roles', () => {
  it('sets the required roles as metadata', () => {
    class TestController {
      test() {}
    }

    Roles('ADMIN', 'FACULTY')(
      TestController.prototype,
      'test',
      Object.getOwnPropertyDescriptor(
        TestController.prototype,
        'test',
      )!,
    );

    const reflector = new Reflector();

    const roles = reflector.get<Role[]>(
      ROLES_KEY,
      TestController.prototype.test,
    );

    expect(roles).toEqual(['ADMIN', 'FACULTY']);
  });
});
