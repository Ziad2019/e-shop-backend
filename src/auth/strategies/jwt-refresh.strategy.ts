import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy }                  from '@nestjs/passport';
import { ExtractJwt, Strategy }              from 'passport-jwt';
import { ConfigService }                     from '@nestjs/config';
import { Request }                           from 'express';
import { JwtPayload, JwtRefreshPayload } from 'src/common/interfaces/jwt-payload.interface';


@Injectable()
export class JwtRefreshStrategy extends PassportStrategy(Strategy, 'jwt-refresh') {
  constructor(configService: ConfigService) {
    super({

      jwtFromRequest: ExtractJwt.fromExtractors([
        (req: Request) => req?.cookies?.refresh_token ?? null,
      ]),
      secretOrKey:        configService.get<string>('JWT_REFRESH_SECRET'),
      passReqToCallback:  true,
      ignoreExpiration:   false,
    });
  }

  async validate(req: Request, payload: JwtPayload): Promise<JwtRefreshPayload> {
    const refreshToken = req.cookies?.refresh_token as string | undefined;

    if (!refreshToken) {
      throw new UnauthorizedException('Refresh token not found');
    }


    return { ...payload, refreshToken };
  }
}
