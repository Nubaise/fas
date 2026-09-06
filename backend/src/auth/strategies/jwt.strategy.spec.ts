import { describe, expect, it } from '@jest/globals';
import { ConfigService } from '@nestjs/config';

import {
  JwtStrategy,
  type JwtPayload,
} from './jwt.strategy.js';

describe('JwtStrategy', () => {
  it('maps JWT payload to the authenticated user context', () => {
    const configService = {
      getOrThrow: () => 'test-secret',
    } as unknown as ConfigService;

    const strategy = new JwtStrategy(configService);

    const payload: JwtPayload = {
      sub: 'user-id',
      role: 'STUDENT',
    };

    expect(strategy.validate(payload)).toEqual({
      id: 'user-id',
      role: 'STUDENT',
    });
  });
});
