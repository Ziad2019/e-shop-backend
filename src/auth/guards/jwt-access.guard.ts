import {
  ExecutionContext, ForbiddenException,
  Injectable, UnauthorizedException,
} from '@nestjs/common';
import { Reflector }    from '@nestjs/core';
import { AuthGuard }    from '@nestjs/passport';
import { Observable }   from 'rxjs';

import { IS_PUBLIC_KEY } from '../decorators/public.decorator';
import { ROLES_KEY }     from '../decorators/roles.decorator';
import { UserRole }      from 'src/models/users/users.schema';
import { JwtPayload } from 'src/common/interfaces/jwt-payload.interface';


@Injectable()
export class JwtAccessGuard extends AuthGuard('jwt-access') {
  constructor(private readonly reflector: Reflector) {
    super();
  }

  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
    // @Public()
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) return true;

    return super.canActivate(context);
  }

// 
  handleRequest<TUser extends JwtPayload>(
    err:     Error | null,
    user:    TUser | false,
    info:    { name?: string; message?: string } | undefined,
    context: ExecutionContext,
  ): TUser {
    //  Passport errors
    if (err || !user) {
      const message =
        info?.name === 'TokenExpiredError'
          ? 'Token has expired'
          : info?.message ?? 'Unauthorized';
      throw err ?? new UnauthorizedException(message);
    }

    //  Role check — 403  401
    const requiredRoles = this.reflector.getAllAndOverride<UserRole[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (requiredRoles?.length) {
      const hasRole = requiredRoles.includes(user.role as UserRole);
      if (!hasRole) {
        throw new ForbiddenException(
          `Access denied. Required role(s): ${requiredRoles.join(', ')}`,
        );
      }
    }

    return user;
  }
}
