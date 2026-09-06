import { describe, expect, it, jest } from '@jest/globals';
import { Reflector } from '@nestjs/core';

import { JwtAuthGuard } from './jwt-auth.guard.js';

describe('JwtAuthGuard', () => {
  it('extends the Passport JWT authentication guard', () => {
    const reflector = new Reflector();
    const guard = new JwtAuthGuard(reflector);

    expect(guard).toBeInstanceOf(JwtAuthGuard);
  });

  it('allows public routes without authentication', () => {
    const reflector = {
      getAllAndOverride: jest.fn().mockReturnValue(true),
    } as unknown as Reflector;

    const guard = new JwtAuthGuard(reflector);

    const context = {
      getHandler: jest.fn(),
      getClass: jest.fn(),
    } as any;

    expect(guard.canActivate(context)).toBe(true);
    expect(reflector.getAllAndOverride).toHaveBeenCalled();
  });
});
