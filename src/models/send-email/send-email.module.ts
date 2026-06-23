import { Module } from '@nestjs/common';
import { MailerModule } from '@nestjs-modules/mailer';
import { ConfigModule, ConfigService } from '@nestjs/config';

import { MailService } from './send-email.service';

// ============================================================
// MAIL MODULE
// Configures and provides email sending functionality.
//
// Uses @nestjs-modules/mailer which wraps Nodemailer under the hood.
//
// Configuration is loaded from environment variables via ConfigService:
//   EMAIL_HOST     → SMTP server hostname (e.g., smtp.gmail.com)
//   EMAIL_PORT     → SMTP port (587 for TLS, 465 for SSL)
//   EMAIL_ADMIN    → sender email address
//   EMAIL_PASSWORD → sender email password or app password
//   EMAIL_FROM     → display name + email (e.g., "E-Shop <noreply@eshop.com>")
//   EMAIL_SECURE   → 'true' for port 465 (SSL), 'false' for port 587 (TLS)
// ============================================================
@Module({
  imports: [
    // ConfigModule must be imported so ConfigService works
    // in forRootAsync useFactory
    ConfigModule,

    MailerModule.forRootAsync({
      imports: [ConfigModule], // ensure ConfigService is available
      useFactory: (config: ConfigService) => {
        const port = Number(config.get<string>('EMAIL_PORT'));

        // --------------------------------------------------
        // 🔴 BUG FIX: 'secure' depends on the PORT being used
        //
        // Port 465 (SSL)  → secure: true  → encrypted from start
        // Port 587 (TLS)  → secure: false → starts plain, upgrades via STARTTLS
        //
        // Using secure: true with port 587 causes connection failures!
        // The fix: read from .env or derive from port number
        // --------------------------------------------------
        const secure = config.get<string>('EMAIL_SECURE') === 'true'
          || port === 465;

        return {
          transport: {
            host:   config.get<string>('EMAIL_HOST'),
            port,
            secure, // ✅ FIXED: dynamic based on port/env
            auth: {
              user: config.get<string>('EMAIL_ADMIN'),
              pass: config.get<string>('EMAIL_PASSWORD'),
            },
            // TLS options for self-signed certs in development
            // Remove in production
            tls: {
              rejectUnauthorized: config.get('NODE_ENV') === 'production',
            },
          },
          defaults: {
            // Default 'from' field for all emails sent by this module
            from: config.get<string>('EMAIL_FROM'),
          },
        };
      },
      inject: [ConfigService],
    }),
  ],
  providers: [MailService],
  exports: [MailService], // export so AuthModule etc. can inject MailService
})
export class MailModule {}