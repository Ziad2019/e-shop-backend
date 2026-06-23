import {
  HttpException, HttpStatus, Injectable,
  NotFoundException, ConflictException, ForbiddenException,
} from '@nestjs/common';
import { InjectModel }    from '@nestjs/mongoose';
import { Model }          from 'mongoose';
import { JwtService }     from '@nestjs/jwt';
import { ConfigService }  from '@nestjs/config';
import { Response }       from 'express';
import * as bcrypt        from 'bcrypt';
import * as crypto        from 'crypto';

import { User }        from 'src/models/users/users.schema';
import { MailService } from 'src/models/send-email/send-email.service';

import { SignUpDto } from './dto/signup.dto';
import { LoginDto } from './dto/login.dto';
import { ForgotPasswordDto } from './dto/forgotPassword.dto';
import { VerifyResetCodeDto } from './dto/verifyPassResetCode.dto';
import { ResetPasswordDto } from './dto/resetPassword.dto';
import { GoogleProfile, JwtPayload } from 'src/common/interfaces/jwt-payload.interface';
import { ApiResponse }               from 'src/common/interfaces/api-response.interface';

// ─── Response Shapes ──────────────────────────────────────────────────────────

export interface AuthResponse {
  status:       number;
  message:      string;
  access_token: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Auth Service
// ─────────────────────────────────────────────────────────────────────────────

@Injectable()
export class AuthService {
  constructor(
    @InjectModel(User.name)
    private readonly userModel: Model<User>,
    private readonly jwtService:    JwtService,
    private readonly configService: ConfigService,
    private readonly mailService:   MailService,
  ) {}

  // ══════════════════════════════════════════
  // PRIVATE HELPERS
  // ══════════════════════════════════════════

  private buildPayload(user: User & { _id: any }): JwtPayload {
    return {
      sub:   user._id.toString(),
      id:    user._id.toString(),
      email: user.email,
      role:  user.role,
    };
  }

  private generateAccessToken(user: User & { _id: any }): Promise<string> {
    return this.jwtService.signAsync(this.buildPayload(user), {
      secret:    this.configService.get<string>('JWT_ACCESS_SECRET'),
      expiresIn: this.configService.get<string>('JWT_ACCESS_EXPIRES_IN') || '15m',
    });
  }

  private generateRefreshToken(user: User & { _id: any }): Promise<string> {
    return this.jwtService.signAsync(this.buildPayload(user), {
      secret:    this.configService.get<string>('JWT_REFRESH_SECRET'),
      expiresIn: this.configService.get<string>('JWT_REFRESH_EXPIRES_IN') || '7d',
    });
  }


  private async saveRefreshToken(
    user:         User & { _id: any },
    refreshToken: string,
    res:          Response,
  ): Promise<void> {
    const hashed = await bcrypt.hash(refreshToken, 10);

    await this.userModel.findByIdAndUpdate(
      user._id,
      { refreshToken: hashed },
      { new: true },
    );

    const isProd = this.configService.get('NODE_ENV') === 'production';

    res.cookie('refresh_token', refreshToken, {
      httpOnly: true,
      secure:   isProd,
      sameSite: isProd ? 'strict' : 'lax',
      maxAge:   7 * 24 * 60 * 60 * 1000, // 7 days
      path:     '/auth/refresh',          
    });
  }

  private clearRefreshCookie(res: Response): void {
    res.clearCookie('refresh_token', {
      httpOnly: true,
      secure:   this.configService.get('NODE_ENV') === 'production',
      sameSite: 'strict',
      path:     '/auth/refresh',
    });
  }

  // ══════════════════════════════════════════
  // SIGNUP
  // ══════════════════════════════════════════

  async signup(dto: SignUpDto, res: Response): Promise<AuthResponse> {
    const exists = await this.userModel.findOne({ email: dto.email });
    if (exists) throw new ConflictException('Email already exists');

    const user          = await this.userModel.create(dto);
    const access_token  = await this.generateAccessToken(user);
    const refresh_token = await this.generateRefreshToken(user);

    await this.saveRefreshToken(user, refresh_token, res);

    return { status: HttpStatus.CREATED, message: 'User registered successfully', access_token };
  }

  // ══════════════════════════════════════════
  // LOGIN
  // ══════════════════════════════════════════

  async login(dto: LoginDto, res: Response): Promise<AuthResponse> {
    const user = await this.userModel
      .findOne({ email: dto.email })
      .select('+password');

    const INVALID_MSG = 'Invalid email or password';

    if (!user) {
      throw new HttpException(INVALID_MSG, HttpStatus.UNAUTHORIZED);
    }

    if (!user.password) {
      throw new HttpException(
        'This account uses Google login. Please sign in with Google.',
        HttpStatus.BAD_REQUEST,
      );
    }

    const isMatch = await bcrypt.compare(dto.password, user.password);
    if (!isMatch) {
      throw new HttpException(INVALID_MSG, HttpStatus.UNAUTHORIZED);
    }

    const access_token  = await this.generateAccessToken(user);
    const refresh_token = await this.generateRefreshToken(user);

    await this.saveRefreshToken(user, refresh_token, res);

    return { status: HttpStatus.OK, message: 'Logged in successfully', access_token };
  }

  // ══════════════════════════════════════════
  // GOOGLE OAUTH — Find or Create
  // ══════════════════════════════════════════

  async googleLogin(profile: GoogleProfile, res: Response): Promise<AuthResponse> {
    let user = await this.userModel.findOne({
      $or: [{ googleId: profile.googleId }, { email: profile.email }],
    });

    if (!user) {
      user = await this.userModel.create({
        name:     profile.name,
        email:    profile.email,
        googleId: profile.googleId,
        avatar:   profile.avatar,
        active:   true,
      });
    } else if (!user.googleId) {
      user.googleId = profile.googleId;
      if (!user.avatar && profile.avatar) user.avatar = profile.avatar;
      await user.save({ validateBeforeSave: false });
    }

    const access_token  = await this.generateAccessToken(user);
    const refresh_token = await this.generateRefreshToken(user);

    await this.saveRefreshToken(user, refresh_token, res);

    return { status: HttpStatus.OK, message: 'Google login successful', access_token };
  }

  // ══════════════════════════════════════════
  // REFRESH TOKENS — Rotation
  // ══════════════════════════════════════════

  async refreshTokens(
    userId:          string,
    rawRefreshToken: string,
    res:             Response,
  ): Promise<AuthResponse> {
    const user = await this.userModel
      .findById(userId)
      .select('+refreshToken');

    if (!user?.refreshToken) {
      throw new ForbiddenException('Access denied');
    }

    const tokenMatches = await bcrypt.compare(rawRefreshToken, user.refreshToken);

    if (!tokenMatches) {
      await this.userModel.findByIdAndUpdate(userId, { refreshToken: null });
      this.clearRefreshCookie(res);
      throw new ForbiddenException(
        'Invalid refresh token. All sessions have been cleared for your security.',
      );
    }

    const access_token  = await this.generateAccessToken(user);
    const refresh_token = await this.generateRefreshToken(user);

    await this.saveRefreshToken(user, refresh_token, res);

    return { status: HttpStatus.OK, message: 'Tokens refreshed successfully', access_token };
  }

  // ══════════════════════════════════════════
  // LOGOUT
  // ══════════════════════════════════════════

  async logout(userId: string, res: Response): Promise<ApiResponse<null>> {
    await this.userModel.findByIdAndUpdate(userId, { refreshToken: null });
    this.clearRefreshCookie(res);

    return { status: HttpStatus.OK, message: 'Logged out successfully', data: null };
  }

  // ══════════════════════════════════════════
  // FORGOT PASSWORD
  // ══════════════════════════════════════════

  async forgotPassword(dto: ForgotPasswordDto): Promise<ApiResponse<null>> {
    const user = await this.userModel.findOne({ email: dto.email });

    if (!user) {
      return {
        status:  HttpStatus.OK,
        message: 'If this email exists, a reset code has been sent',
        data:    null,
      };
    }

    const resetCode       = crypto.randomInt(100_000, 999_999).toString();
    const hashedResetCode = crypto.createHash('sha256').update(resetCode).digest('hex');
console.log(resetCode, hashedResetCode)
    user.passwordResetCode     = hashedResetCode;
    user.passwordResetExpires  = new Date(Date.now() + 10 * 60 * 1000); // 10 min
    user.passwordResetVerified = false;

    await user.save({ validateBeforeSave: false });

    try {
      await this.mailService.sendEmail({
        email:   user.email,
        subject: 'Your password reset code (valid for 10 minutes)',
        message: `Hi ${user.name},\n\nYour reset code is: ${resetCode}\n\nThis code expires in 10 minutes.`,
      });
    } catch {
      await this.userModel.findByIdAndUpdate(user._id, {
        $unset: {
          passwordResetCode:     '',
          passwordResetExpires:  '',
          passwordResetVerified: '',
        },
      });
      throw new HttpException('Failed to send reset code. Please try again.', HttpStatus.INTERNAL_SERVER_ERROR);
    }

    return {
      status:  HttpStatus.OK,
      message: 'If this email exists, a reset code has been sent',
      data:    null,
    };
  }

  // ══════════════════════════════════════════
  // VERIFY RESET CODE
  // ══════════════════════════════════════════

  async verifyResetCode(
    dto: VerifyResetCodeDto,
  ): Promise<{ status: number; message: string; resetToken: string }> {
    const hashedResetCode = crypto
      .createHash('sha256')
      .update(dto.resetCode)
      .digest('hex');

    const user = await this.userModel.findOne({
      passwordResetCode:    hashedResetCode,
      passwordResetExpires: { $gt: Date.now() },
    });

    if (!user) {
      throw new HttpException('Reset code is invalid or has expired', HttpStatus.BAD_REQUEST);
    }

    user.passwordResetVerified = true;
    await user.save({ validateBeforeSave: false });

    const resetToken = await this.jwtService.signAsync(
      { sub: user._id.toString(), purpose: 'password-reset' },
      {
        secret:    this.configService.get<string>('JWT_ACCESS_SECRET'),
        expiresIn: '10m',
      },
    );

    return { status: HttpStatus.OK, message: 'Reset code verified', resetToken };
  }

  // ══════════════════════════════════════════
  // RESET PASSWORD
  // ══════════════════════════════════════════

  async resetPassword(dto: ResetPasswordDto): Promise<AuthResponse> {
    let payload: { sub: string; purpose: string };

    try {
      payload = await this.jwtService.verifyAsync(dto.resetToken, {
        secret: this.configService.get<string>('JWT_ACCESS_SECRET'),
      });
    } catch {
      throw new HttpException('Reset token is invalid or has expired', HttpStatus.BAD_REQUEST);
    }

    if (payload.purpose !== 'password-reset') {
      throw new HttpException('Invalid reset token', HttpStatus.BAD_REQUEST);
    }

    const user = await this.userModel.findById(payload.sub).select('+password');
    if (!user) throw new NotFoundException('User not found');

    if (!user.passwordResetVerified) {
      throw new HttpException('Reset code has not been verified', HttpStatus.BAD_REQUEST);
    }

    user.password = dto.newPassword;

    await user.save();
    await this.userModel.findByIdAndUpdate(user._id, {
      $unset: {
        passwordResetCode:     '',
        passwordResetExpires:  '',
        passwordResetVerified: '',
      },
    });

    const access_token = await this.generateAccessToken(user);
    return { status: HttpStatus.OK, message: 'Password reset successfully', access_token };
  }
}
