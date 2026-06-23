import { MailerService } from '@nestjs-modules/mailer';
import {
  Injectable, Logger,
  InternalServerErrorException,
} from '@nestjs/common';
import { MailOptions } from 'src/common/interfaces/mail-options.interface';



@Injectable()
export class MailService {
  // Logger scoped to this service — shows 'MailService' in logs
  private readonly logger = new Logger(MailService.name);

  constructor(private readonly mailerService: MailerService) {}

  // ----------------------------------------------------------
  // SEND EMAIL
  //
  // Supports both plain text and HTML email bodies.
  // If html is provided → email clients show HTML version
  // text is always included as fallback for clients that
  // don't support HTML (e.g., some mobile clients)

  async sendEmail(options: MailOptions): Promise<void> {
    try {
      await this.mailerService.sendMail({
        to:      options.email,
        subject: options.subject,
        text:    options.message,        // plain text fallback
        html:    options.html,           // optional HTML version
      });

      // Log success with subject for easier debugging
      this.logger.log(
        `✅ Email sent to "${options.email}" | Subject: "${options.subject}"`,
      );

    } catch (error) {
      // Log the full error stack for debugging
      this.logger.error(
        `❌ Failed to send email to "${options.email}" | Subject: "${options.subject}"`,
        error.stack,
      );

      // ✅ FIX: throw NestJS exception instead of generic Error
      // This ensures the error is handled by NestJS exception filters
      // and returns a proper JSON response to the client
      throw new InternalServerErrorException(
        `Failed to send email to ${options.email}. Please try again later.`,
      );
    }
  }

  // ----------------------------------------------------------
  // SEND PASSWORD RESET EMAIL
  // A dedicated method with a pre-formatted HTML template
  // for password reset emails — used by AuthService
  // ----------------------------------------------------------
  async sendPasswordResetEmail(
    email: string,
    name: string,
    resetCode: string,
  ): Promise<void> {
    await this.sendEmail({
      email,
      subject: 'Your Password Reset Code (valid for 10 minutes)',
      // Plain text version (fallback)
      message: `
        Hi ${name},
        Your password reset code is: ${resetCode}
        This code expires in 10 minutes.
        If you didn't request this, please ignore this email.
        – The E-Shop Team
      `,
      // HTML version (shown in modern email clients)
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">Password Reset Request</h2>
          <p>Hi <strong>${name}</strong>,</p>
          <p>We received a request to reset your password.</p>
          <p>Your reset code is:</p>
          <div style="
            background: #f4f4f4;
            border-radius: 8px;
            padding: 20px;
            text-align: center;
            margin: 20px 0;
          ">
            <span style="
              font-size: 32px;
              font-weight: bold;
              letter-spacing: 8px;
              color: #333;
            ">${resetCode}</span>
          </div>
          <p style="color: #666; font-size: 14px;">
            ⏰ This code expires in <strong>10 minutes</strong>.
          </p>
          <p style="color: #666; font-size: 14px;">
            If you didn't request this, you can safely ignore this email.
          </p>
          <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
          <p style="color: #999; font-size: 12px;">– The E-Shop Team</p>
        </div>
      `,
    });
  }

  // ----------------------------------------------------------
  // SEND ORDER CONFIRMATION EMAIL
  // Template for order confirmation — used by OrdersService
  // ----------------------------------------------------------
  async sendOrderConfirmationEmail(
    email: string,
    name: string,
    orderId: string,
    totalPrice: number,
  ): Promise<void> {
    await this.sendEmail({
      email,
      subject: `Order Confirmed – #${orderId}`,
      message: `
        Hi ${name},
        Your order #${orderId} has been confirmed!
        Total: ${totalPrice} EGP
        Thank you for shopping with E-Shop!
      `,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #28a745;">✅ Order Confirmed!</h2>
          <p>Hi <strong>${name}</strong>,</p>
          <p>Your order has been confirmed and is being processed.</p>
          <div style="background: #f4f4f4; border-radius: 8px; padding: 20px; margin: 20px 0;">
            <p><strong>Order ID:</strong> #${orderId}</p>
            <p><strong>Total:</strong> ${totalPrice} EGP</p>
          </div>
          <p>Thank you for shopping with <strong>E-Shop</strong>! 🛍️</p>
          <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
          <p style="color: #999; font-size: 12px;">– The E-Shop Team</p>
        </div>
      `,
    });
  }
}