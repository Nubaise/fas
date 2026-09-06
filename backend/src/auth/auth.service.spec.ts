import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { JwtService } from '@nestjs/jwt';
import * as argon2 from 'argon2';

import { AuthService } from './auth.service.js';
import { UsersService } from '../users/users.service.js';

describe('AuthService', () => {
  let authService: AuthService;

  const usersService = {
    findByEmail: jest.fn<(email: string) => Promise<unknown>>(),
  };

  const jwtService = {
    signAsync: jest.fn<(payload: object) => Promise<string>>(),
  };

  beforeEach(() => {
    jest.clearAllMocks();

    authService = new AuthService(
      usersService as unknown as UsersService,
      jwtService as unknown as JwtService,
    );
  });

  it('authenticates a user with valid credentials', async () => {
    const password = 'CorrectPassword123!';
    const passwordHash = await argon2.hash(password);

    usersService.findByEmail.mockResolvedValue({
      id: 'user-id',
      email: 'student@example.com',
      passwordHash,
      role: 'STUDENT',
      isActive: true,
    });

    await expect(
      authService.validateCredentials(
        'student@example.com',
        password,
      ),
    ).resolves.toEqual({
      id: 'user-id',
      role: 'STUDENT',
    });
  });

  it('rejects an incorrect password', async () => {
    const passwordHash = await argon2.hash('CorrectPassword123!');

    usersService.findByEmail.mockResolvedValue({
      id: 'user-id',
      email: 'student@example.com',
      passwordHash,
      role: 'STUDENT',
      isActive: true,
    });

    await expect(
      authService.validateCredentials(
        'student@example.com',
        'WrongPassword123!',
      ),
    ).rejects.toThrow('Invalid credentials');
  });

  it('rejects an unknown user', async () => {
    usersService.findByEmail.mockResolvedValue(null);

    await expect(
      authService.validateCredentials(
        'unknown@example.com',
        'AnyPassword123!',
      ),
    ).rejects.toThrow('Invalid credentials');
  });

  it('rejects an inactive user', async () => {
    const passwordHash = await argon2.hash('CorrectPassword123!');

    usersService.findByEmail.mockResolvedValue({
      id: 'user-id',
      email: 'student@example.com',
      passwordHash,
      role: 'STUDENT',
      isActive: false,
    });

    await expect(
      authService.validateCredentials(
        'student@example.com',
        'CorrectPassword123!',
      ),
    ).rejects.toThrow('Invalid credentials');
  });

  it('logs in a user and returns an access token', async () => {
    const password = 'CorrectPassword123!';
    const passwordHash = await argon2.hash(password);

    usersService.findByEmail.mockResolvedValue({
      id: 'user-id',
      email: 'student@example.com',
      passwordHash,
      role: 'STUDENT',
      isActive: true,
    });

    jwtService.signAsync.mockResolvedValue('signed-access-token');

    await expect(
      authService.login(
        'student@example.com',
        password,
      ),
    ).resolves.toEqual({
      accessToken: 'signed-access-token',
    });

    expect(jwtService.signAsync).toHaveBeenCalledWith({
      sub: 'user-id',
      role: 'STUDENT',
    });
  });
});
