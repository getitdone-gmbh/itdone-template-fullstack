import { Controller, Get } from '@nestjs/common';

@Controller()
export class AppController {
  @Get()
  root() {
    return { status: 'ok' };
  }

  @Get('health')
  health() {
    return { status: 'ok' };
  }

  @Get('api/config')
  config() {
    return {
      issuer: process.env.OIDC_ISSUER ?? null,
      clientId: process.env.OIDC_CLIENT_ID ?? null,
    };
  }
}
