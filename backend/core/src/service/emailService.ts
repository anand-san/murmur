import { Resend } from "resend";
import env from "../../env";

export interface EmailOptions {
  to: string | string[];
  from?: string;
  subject: string;
  html?: string;
  text?: string;
}

export interface OTPEmailOptions {
  email: string;
  otp: string;
  type: "sign-in" | "email-verification" | "forget-password";
}

export class EmailService {
  private resend: Resend | null = null;
  private defaultFromAddress = "Murmur <murmur@updates.sandilya.dev>";

  constructor() {
    if (env.RESEND_API_KEY) {
      this.resend = new Resend(env.RESEND_API_KEY);
    }
  }

  /**
   * Send a generic email
   */
  async sendEmail(options: EmailOptions): Promise<void> {
    if (!this.resend) {
      console.warn("RESEND_API_KEY not configured. Email not sent.");
      return;
    }

    const { to, from = this.defaultFromAddress, subject, html, text } = options;

    // Prepare email payload - ensure we have either html or text content
    const emailPayload: any = {
      from,
      to: Array.isArray(to) ? to : [to],
      subject,
    };

    if (html) {
      emailPayload.html = html;
    }
    if (text) {
      emailPayload.text = text;
    }

    // If neither html nor text is provided, use a default text message
    if (!html && !text) {
      emailPayload.text = "This is a notification from Murmur.";
    }

    try {
      await this.resend.emails.send(emailPayload);

      console.log(
        `Email sent successfully to ${Array.isArray(to) ? to.join(", ") : to}`
      );
    } catch (error) {
      console.error("Failed to send email:", error);
      throw new Error("Failed to send email");
    }
  }

  /**
   * Send OTP verification email
   */
  async sendVerificationOTP(options: OTPEmailOptions): Promise<void> {
    const { email, otp, type } = options;

    console.log(`Sending OTP to ${email} for ${type}, OTP: ${otp}`);

    const subject = this.getOTPSubject(type);
    const html = this.generateOTPEmailHTML(otp, type);

    await this.sendEmail({
      to: email,
      subject,
      html,
    });

    console.log(`OTP sent to ${email} for ${type}`);
  }

  /**
   * Send welcome email to new users
   */
  async sendWelcomeEmail(email: string, userName?: string): Promise<void> {
    const subject = "Welcome to Murmur!";
    const html = this.generateWelcomeEmailHTML(userName);

    await this.sendEmail({
      to: email,
      subject,
      html,
    });
  }

  /**
   * Send password reset confirmation email
   */
  async sendPasswordResetConfirmation(email: string): Promise<void> {
    const subject = "Password Reset Successful";
    const html = this.generatePasswordResetConfirmationHTML();

    await this.sendEmail({
      to: email,
      subject,
      html,
    });
  }

  /**
   * Get appropriate subject line for OTP emails
   */
  private getOTPSubject(type: OTPEmailOptions["type"]): string {
    switch (type) {
      case "sign-in":
        return "Your Murmur Sign-in Code";
      case "email-verification":
        return "Verify Your Murmur Email";
      case "forget-password":
        return "Reset Your Murmur Password";
      default:
        return "Your Murmur Verification Code";
    }
  }

  /**
   * Generate HTML template for OTP emails
   */
  private generateOTPEmailHTML(
    otp: string,
    type: OTPEmailOptions["type"]
  ): string {
    const actionText = this.getActionText(type);

    return `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #333; margin: 0;">Murmur</h1>
        </div>
        
        <div style="background: #f9f9f9; border-radius: 8px; padding: 30px; margin-bottom: 20px;">
          <h2 style="color: #333; margin-top: 0;">Hello!</h2>
          <p style="color: #666; font-size: 16px; line-height: 1.5;">
            ${actionText}
          </p>
          
          <div style="background: #fff; border: 2px dashed #ddd; border-radius: 8px; padding: 20px; text-align: center; margin: 20px 0;">
            <p style="margin: 0 0 10px 0; color: #666; font-size: 14px;">Your verification code is:</p>
            <div style="font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #333; font-family: 'Courier New', monospace;">
              ${otp}
            </div>
          </div>
          
          <p style="color: #666; font-size: 14px; margin-bottom: 0;">
            <strong>Important:</strong> This code will expire in 5 minutes for your security.
          </p>
        </div>
        
        <div style="border-top: 1px solid #eee; padding-top: 20px;">
          <p style="color: #999; font-size: 12px; text-align: center; margin: 0;">
            If you didn't request this code, please ignore this email.<br>
            This email was sent automatically. Please do not reply.
          </p>
        </div>
      </div>
    `;
  }

  /**
   * Generate HTML template for welcome emails
   */
  private generateWelcomeEmailHTML(userName?: string): string {
    const greeting = userName ? `Hello ${userName}!` : "Hello!";

    return `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #333; margin: 0;">Welcome to Murmur!</h1>
        </div>
        
        <div style="background: #f9f9f9; border-radius: 8px; padding: 30px; margin-bottom: 20px;">
          <h2 style="color: #333; margin-top: 0;">${greeting}</h2>
          <p style="color: #666; font-size: 16px; line-height: 1.5;">
            Thank you for joining Murmur! We're excited to have you on board.
          </p>
          
          <p style="color: #666; font-size: 16px; line-height: 1.5;">
            Murmur helps you interact with AI in a more natural and intuitive way. 
            You can now start having conversations, getting assistance, and exploring 
            the possibilities of AI-powered communication.
          </p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${env.FRONTEND_URL}" 
               style="background: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
              Get Started
            </a>
          </div>
        </div>
        
        <div style="border-top: 1px solid #eee; padding-top: 20px;">
          <p style="color: #999; font-size: 12px; text-align: center; margin: 0;">
            Welcome aboard!<br>
            The Murmur Team
          </p>
        </div>
      </div>
    `;
  }

  /**
   * Generate HTML template for password reset confirmation
   */
  private generatePasswordResetConfirmationHTML(): string {
    return `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #333; margin: 0;">Murmur</h1>
        </div>
        
        <div style="background: #f9f9f9; border-radius: 8px; padding: 30px; margin-bottom: 20px;">
          <h2 style="color: #333; margin-top: 0;">Password Reset Successful</h2>
          <p style="color: #666; font-size: 16px; line-height: 1.5;">
            Your password has been successfully reset. You can now sign in with your new password.
          </p>
          
          <p style="color: #666; font-size: 16px; line-height: 1.5;">
            If you didn't reset your password, please contact our support team immediately.
          </p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${env.FRONTEND_URL}" 
               style="background: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
              Sign In Now
            </a>
          </div>
        </div>
        
        <div style="border-top: 1px solid #eee; padding-top: 20px;">
          <p style="color: #999; font-size: 12px; text-align: center; margin: 0;">
            Stay secure!<br>
            The Murmur Team
          </p>
        </div>
      </div>
    `;
  }

  /**
   * Get action text for different OTP types
   */
  private getActionText(type: OTPEmailOptions["type"]): string {
    switch (type) {
      case "sign-in":
        return "You're trying to sign in to your Murmur account. Please use the verification code below to complete your sign-in.";
      case "email-verification":
        return "Please verify your email address to complete your Murmur account setup. Use the verification code below.";
      case "forget-password":
        return "You've requested to reset your password. Please use the verification code below to proceed with resetting your password.";
      default:
        return "Please use the verification code below to complete your request.";
    }
  }

  /**
   * Check if email service is configured
   */
  isConfigured(): boolean {
    return this.resend !== null;
  }
}

// Export a singleton instance
export const emailService = new EmailService();
