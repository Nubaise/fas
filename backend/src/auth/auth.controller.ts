import { Body, Controller, Post, Version } from '@nestjs/common';

import { AuthService } from './auth.service.js';
import { Public } from './decorators/public.decorator.js';
import { loginSchema, type LoginDto } from './dto/login.dto.js';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  @Public()
  @Version('1')
  async login(@Body(loginSchema) body: LoginDto) {
    return this.authService.login(body.email, body.password);
  }
}
