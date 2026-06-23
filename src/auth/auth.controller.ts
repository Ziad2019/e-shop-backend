import {
  Controller, Post, Get, Body, HttpCode, HttpStatus,
  UseGuards, Req, Res, ValidationPipe,
} from '@nestjs/common';
import {
  ApiTags, ApiOperation, ApiResponse,
  ApiBearerAuth, ApiCookieAuth,
} from '@nestjs/swagger';
import { Request, Response } from 'express';

import { AuthService }      from './auth.service';
import { Public }           from './decorators/public.decorator';
import { GetUser }          from './decorators/get-user.decorator';
import { JwtRefreshGuard }  from './guards/jwt-refresh.guard';
import { GoogleOAuthGuard } from './guards/google-oauth.guard';



import { ConfigService }             from '@nestjs/config';
import { SignUpDto } from './dto/signup.dto';
import { LoginDto } from './dto/login.dto';
import { ForgotPasswordDto } from './dto/forgotPassword.dto';
import { VerifyResetCodeDto } from './dto/verifyPassResetCode.dto';
import { ResetPasswordDto } from './dto/resetPassword.dto';
import { GoogleProfile, JwtPayload } from 'src/common/interfaces/jwt-payload.interface';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService:    AuthService,
    private readonly configService:  ConfigService,
  ) {}


  @Public()
  @Post('signup')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Register a new user account' })
  @ApiResponse({ status: 201, description: 'User registered successfully' })
  @ApiResponse({ status: 409, description: 'Email already exists' })
  signup(
    @Body(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }))
    dto: SignUpDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    return this.authService.signup(dto, res);
  }

  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Login with email and password' })
  @ApiResponse({ status: 200, description: 'Logged in successfully' })
  @ApiResponse({ status: 401, description: 'Invalid email or password' })
  login(
    @Body(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }))
    dto: LoginDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    return this.authService.login(dto, res);
  }

  // ══════════════════════════════════════════
  // GOOGLE OAUTH
  // ══════════════════════════════════════════

  /**
   * GET /auth/google
   */
  @Public()
  @Get('google')
  @UseGuards(GoogleOAuthGuard)
  @ApiOperation({ summary: 'Redirect to Google OAuth consent screen' })
  googleAuth() {
    
  }

  /**

   * GET /auth/google/callback
   */
  @Public()
  @Get('google/callback')
  @UseGuards(GoogleOAuthGuard)
  @ApiOperation({ summary: 'Google OAuth callback — handled by Passport' })
  async googleCallback(
    @Req() req: Request & { user: GoogleProfile },
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.authService.googleLogin(req.user, res);
    
    const frontendUrl = this.configService.get<string>('FRONTEND_URL');
    return res.redirect(
      `${frontendUrl}/auth/callback?token=${result.access_token}`,
    );
  }

  // ══════════════════════════════════════════
  // TOKEN MANAGEMENT
  // ══════════════════════════════════════════

  @Public()
  @UseGuards(JwtRefreshGuard)
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Refresh access token using HttpOnly refresh cookie' })
  @ApiCookieAuth('refresh_token')
  @ApiResponse({ status: 200, description: 'Tokens refreshed successfully' })
  @ApiResponse({ status: 403, description: 'Invalid or expired refresh token' })
  refresh(
    @Req() req: Request & { user: JwtPayload & { refreshToken: string } },
    @Res({ passthrough: true }) res: Response,
  ) {
    return this.authService.refreshTokens(req.user.sub, req.user.refreshToken, res);
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Logout and clear refresh token' })
  @ApiResponse({ status: 200, description: 'Logged out successfully' })
  logout(
    @GetUser('sub') userId: string,
    @Res({ passthrough: true }) res: Response,
  ) {
    return this.authService.logout(userId, res);
  }

  // ══════════════════════════════════════════
  // PASSWORD RESET FLOW
  // ══════════════════════════════════════════

  @Public()
  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Request a password reset code via email' })
  @ApiResponse({ status: 200, description: 'Reset code sent if email exists' })
  forgotPassword(
    @Body(new ValidationPipe({ whitelist: true })) dto: ForgotPasswordDto,
  ) {
    return this.authService.forgotPassword(dto);
  }

  @Public()
  @Post('verify-reset-code')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Verify the 6-digit password reset code' })
  @ApiResponse({ status: 200, description: 'Code verified — returns short-lived resetToken' })
  @ApiResponse({ status: 400, description: 'Invalid or expired code' })
  verifyResetCode(
    @Body(new ValidationPipe({ whitelist: true })) dto: VerifyResetCodeDto,
  ) {
    return this.authService.verifyResetCode(dto);
  }

  @Public()
  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Reset password using the resetToken from verify step' })
  @ApiResponse({ status: 200, description: 'Password reset successfully' })
  @ApiResponse({ status: 400, description: 'Invalid or expired reset token' })
  resetPassword(
    @Body(new ValidationPipe({ whitelist: true })) dto: ResetPasswordDto,
  ) {
    return this.authService.resetPassword(dto);
  }
}
