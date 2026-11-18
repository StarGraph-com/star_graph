import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Header,
  Headers,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard, readBearerToken } from './auth.guard';
import type { AuthenticatedRequest } from './auth.guard';
import { AuthService } from './auth.service';

function readCredentials(body: unknown) {
  const { email, password } = (body ?? {}) as Record<string, unknown>;
  if (typeof email !== 'string' || !/^[^\s@]+@[^\s@]+$/.test(email.trim())) {
    throw new BadRequestException('Enter a valid email address.');
  }
  if (typeof password !== 'string' || !password) {
    throw new BadRequestException('Enter a password.');
  }

  return { email: email.trim(), password };
}

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @Header('Cache-Control', 'no-store')
  register(@Body() body: unknown) {
    return this.authService.register(readCredentials(body));
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @Header('Cache-Control', 'no-store')
  login(@Body() body: unknown) {
    return this.authService.login(readCredentials(body));
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @Header('Cache-Control', 'no-store')
  refresh(@Body() body: unknown) {
    const { refreshToken } = (body ?? {}) as Record<string, unknown>;
    if (
      typeof refreshToken !== 'string' ||
      !refreshToken ||
      /\s/.test(refreshToken)
    ) {
      throw new BadRequestException('Provide a refresh token.');
    }
    return this.authService.refresh(refreshToken);
  }

  @Post('logout')
  @HttpCode(HttpStatus.NO_CONTENT)
  @Header('Cache-Control', 'no-store')
  logout(@Headers('authorization') authorization: string | undefined) {
    return this.authService.logout(readBearerToken(authorization));
  }

  @Get('me')
  @UseGuards(AuthGuard)
  @Header('Cache-Control', 'no-store')
  me(@Req() request: AuthenticatedRequest) {
    return { user: request.authUser };
  }
}
