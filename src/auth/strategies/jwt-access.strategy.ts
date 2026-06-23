import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy }                  from '@nestjs/passport';
import { ExtractJwt, Strategy }              from 'passport-jwt';
import { ConfigService }                     from '@nestjs/config';
import { InjectModel }                       from '@nestjs/mongoose';
import { Model }                             from 'mongoose';

import { User }       from 'src/models/users/users.schema';
import { JwtPayload } from 'src/common/interfaces/jwt-payload.interface';

@Injectable()
export class JwtAccessStrategy extends PassportStrategy(Strategy, 'jwt-access') {
  constructor(
    configService: ConfigService,
    @InjectModel(User.name)
    private readonly userModel: Model<User>,
  ) {
    super({
      jwtFromRequest:   ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey:      configService.get<string>('JWT_ACCESS_SECRET'),
      ignoreExpiration: false,
    });
  }


  async validate(payload: JwtPayload & { iat: number }): Promise<JwtPayload> {
    const user = await this.userModel
      .findById(payload.sub)
      .select('+passwordChangedAt');

    if (!user) {
      throw new UnauthorizedException('User no longer exists');
    }

    if (!user.active) {
      throw new UnauthorizedException('User account is deactivated');
    }

    if (user.passwordChangedAt && payload.iat) {
      const changedTimestamp = Math.floor(user.passwordChangedAt.getTime() / 1000);
      if (changedTimestamp > payload.iat) {
        throw new UnauthorizedException(
          'Password was changed recently. Please log in again.',
        );
      }
    }

    return {
      sub:   user._id.toString(),
      id:    user._id.toString(),
      email: user.email,
      role:  user.role,
    };
  }
}
