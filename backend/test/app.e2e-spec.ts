import { Test, TestingModule } from '@nestjs/testing';
import {
  Controller,
  Get,
  INestApplication,
} from '@nestjs/common';
import request from 'supertest';

import { AppModule } from '../src/app.module.js';
import { Public } from '../src/auth/decorators/public.decorator.js';
import { Roles } from '../src/auth/decorators/roles.decorator.js';
import { JwtService } from '@nestjs/jwt';

@Controller('test')
class TestAuthController {
  @Get('public')
  @Public()
  publicRoute() {
    return { message: 'public' };
  }

  @Get('protected')
  protectedRoute() {
    return { message: 'protected' };
  }

  @Get('admin')
  @Roles('ADMIN')
  adminRoute() {
    return { message: 'admin' };
  }
}

describe('Authentication and Authorization (e2e)', () => {
  let app: INestApplication;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
      controllers: [TestAuthController],
    }).compile();

    app = moduleFixture.createNestApplication();

    app.setGlobalPrefix('api');

    await app.init();
  });

  it('allows access to a public route without a JWT', () => {
    return request(app.getHttpServer())
      .get('/api/test/public')
      .expect(200)
      .expect({ message: 'public' });
  });

  it('rejects a protected route without a JWT', () => {
    return request(app.getHttpServer())
      .get('/api/test/protected')
      .expect(401);
  });

  it('rejects a protected route with an invalid JWT', () => {
    return request(app.getHttpServer())
      .get('/api/test/protected')
      .set('Authorization', 'Bearer invalid-token')
      .expect(401);
  });

  it('rejects an admin route without a JWT', () => {
    return request(app.getHttpServer())
      .get('/api/test/admin')
      .expect(401);
  });

  it('rejects a student from an admin route with 403', async () => {
    const jwtService = app.get(JwtService);

    const token = await jwtService.signAsync({
      sub: 'test-student-id',
      role: 'STUDENT',
    });

    await request(app.getHttpServer())
      .get('/api/test/admin')
      .set('Authorization', `Bearer ${token}`)
      .expect(403);
  });

  it('allows an authenticated student to access a protected route', async () => {
    const jwtService = app.get(JwtService);

    const token = await jwtService.signAsync({
      sub: 'test-student-id',
      role: 'STUDENT',
    });

    await request(app.getHttpServer())
      .get('/api/test/protected')
      .set('Authorization', `Bearer ${token}`)
      .expect(200)
      .expect({ message: 'protected' });
  });

  afterEach(async () => {
    await app.close();
  });
});
