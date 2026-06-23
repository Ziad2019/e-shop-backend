
export interface MailOptions {
  // Recipient email address
  email: string;

  // Email subject line
  subject: string;


  message: string;

  html?: string;
}