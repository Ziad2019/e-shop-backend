import { Module }        from '@nestjs/common';
import { JwtModule }     from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_GUARD }     from '@nestjs/core';

import { AuthService }    from './auth.service';
import { AuthController } from './auth.controller';

import { JwtAccessGuard }    from './guards/jwt-access.guard';
import { JwtAccessStrategy }  from './strategies/jwt-access.strategy';
import { JwtRefreshStrategy } from './strategies/jwt-refresh.strategy';
import { GoogleStrategy }     from './strategies/google.strategy';

import { UsersModule } from 'src/models/users/users.module';
import { MailModule }  from 'src/models/send-email/send-email.module';

@Module({
  imports: [
    UsersModule,
    MailModule,
    PassportModule.register({ defaultStrategy: 'jwt-access' }),
    JwtModule.registerAsync({
      imports:    [ConfigModule],
      inject:     [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret:      config.get<string>('JWT_ACCESS_SECRET'),
        signOptions: { expiresIn: config.get<string>('JWT_ACCESS_EXPIRES_IN') || '15m' },
      }),
      global: true,
    }),
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    JwtAccessStrategy,   
    JwtRefreshStrategy,
    GoogleStrategy,
    {
      provide:  APP_GUARD,
      useClass: JwtAccessGuard,
    },
  ],
  exports: [],          
})
export class AuthModule {}