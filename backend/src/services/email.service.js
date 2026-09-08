import nodemailer from 'nodemailer';
import { env } from '../config/env.js';

let transporter = null;

const getTransporter = async () => {
  if (transporter) return transporter;

  if (env.SMTP_HOST && env.SMTP_USER) {
    transporter = nodemailer.createTransport({
      host: env.SMTP_HOST,
      port: env.SMTP_PORT,
      secure: env.SMTP_SECURE,
      auth: {
        user: env.SMTP_USER,
        pass: env.SMTP_PASSWORD
      }
    });
  } else {
    // Development fallback using Ethereal or mock logger
    try {
      const testAccount = await nodemailer.createTestAccount();
      transporter = nodemailer.createTransport({
        host: 'smtp.ethereal.email',
        port: 587,
        secure: false,
        auth: {
          user: testAccount.user,
          pass: testAccount.pass
        }
      });
      console.log('📧 Ethereal Test Mailer initialized (Development mode)');
    } catch (err) {
      console.warn('⚠️ Could not initialize Ethereal test mailer. Using console transport fallback.');
      transporter = {
        sendMail: async (options) => {
          console.log('\n--- 📧 DISPATCHED EMAIL (Console Fallback) ---');
          console.log(`To: ${options.to}`);
          console.log(`Subject: ${options.subject}`);
          console.log(`Text:\n${options.text}`);
          console.log('----------------------------------------------\n');
          return { messageId: 'mock-console-id' };
        }
      };
    }
  }

  return transporter;
};

/**
 * Send Account Invitation Email
 */
export const sendInvitationEmail = async ({ to, fullName, role, organizationName, rawToken }) => {
  const mailer = await getTransporter();
  const directActivationUrl = `http://localhost:${env.PORT}/api/auth/activate?token=${rawToken}`;
  const activationUrl = env.FRONTEND_URL ? `${env.FRONTEND_URL}/activate?token=${rawToken}` : directActivationUrl;

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; background-color: #f4f6f9; margin: 0; padding: 0; color: #1e293b; }
        .container { max-width: 600px; margin: 30px auto; background: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1); border: 1px solid #e2e8f0; }
        .header { background: #0f172a; color: #ffffff; padding: 24px; text-align: center; }
        .header h1 { margin: 0; font-size: 22px; letter-spacing: 1px; }
        .header p { margin: 4px 0 0 0; color: #94a3b8; font-size: 13px; text-transform: uppercase; }
        .content { padding: 32px 24px; }
        .info-box { background: #f8fafc; border-left: 4px solid #2563eb; padding: 16px; margin: 20px 0; border-radius: 0 6px 6px 0; }
        .info-box p { margin: 6px 0; font-size: 14px; }
        .btn-wrapper { text-align: center; margin: 32px 0; }
        .btn { background: #2563eb; color: #ffffff !important; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 15px; display: inline-block; }
        .footer { background: #f8fafc; padding: 20px; text-align: center; font-size: 12px; color: #64748b; border-top: 1px solid #e2e8f0; }
        .notice { font-size: 13px; color: #dc2626; margin-top: 20px; font-weight: 500; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>NIVARA</h1>
          <p>National Infrastructure Verification & Accountability Reporting Authority</p>
        </div>
        <div class="content">
          <h2>Official Account Invitation</h2>
          <p>Dear <strong>${fullName}</strong>,</p>
          <p>An official administrative account has been provisioned for you on the <strong>NIVARA Platform</strong>.</p>
          
          <div class="info-box">
            <p><strong>Assigned Role:</strong> ${role}</p>
            <p><strong>Organization:</strong> ${organizationName || 'Central Authority'}</p>
            <p><strong>Official Email:</strong> ${to}</p>
          </div>

          <p>To activate your account and set your secure password, please click the button below:</p>
          
          <div class="btn-wrapper">
            <a href="${activationUrl}" class="btn" target="_blank">Activate NIVARA Account</a>
          </div>

          <p class="notice">⏰ Important: This activation link is strictly confidential, single-use, and will expire in 24 hours.</p>
          
          <p style="font-size: 13px; color: #64748b; word-break: break-all;">
            If the button above does not work, copy and paste this URL into your browser:<br>
            <a href="${activationUrl}">${activationUrl}</a>
          </p>
        </div>
        <div class="footer">
          <p>&copy; NIVARA Security & Governance Infrastructure. All rights reserved.</p>
          <p>This is a system-generated transmission. Please do not reply to this email.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  const info = await mailer.sendMail({
    from: env.MAIL_FROM,
    to,
    subject: 'NIVARA Account Invitation',
    text: `Hello ${fullName},\n\nYou have been invited to NIVARA as ${role} for ${organizationName || 'Central Authority'}.\n\nPlease activate your account within 24 hours by visiting:\n${activationUrl}\n\nNIVARA Security Team`,
    html
  });

  if (nodemailer.getTestMessageUrl && info && info.messageId) {
    const previewUrl = nodemailer.getTestMessageUrl(info);
    if (previewUrl) {
      console.log(`🔗 Email Preview (Ethereal): ${previewUrl}`);
    }
  }

  return info;
};

/**
 * Send Password Reset Email
 */
export const sendPasswordResetEmail = async ({ to, fullName, rawToken }) => {
  const mailer = await getTransporter();
  const resetUrl = `${env.FRONTEND_URL}/reset-password?token=${rawToken}`;

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; background-color: #f4f6f9; margin: 0; padding: 0; color: #1e293b; }
        .container { max-width: 600px; margin: 30px auto; background: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1); border: 1px solid #e2e8f0; }
        .header { background: #0f172a; color: #ffffff; padding: 24px; text-align: center; }
        .header h1 { margin: 0; font-size: 22px; }
        .content { padding: 32px 24px; }
        .btn-wrapper { text-align: center; margin: 32px 0; }
        .btn { background: #dc2626; color: #ffffff !important; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 15px; display: inline-block; }
        .footer { background: #f8fafc; padding: 20px; text-align: center; font-size: 12px; color: #64748b; border-top: 1px solid #e2e8f0; }
        .notice { font-size: 13px; color: #b91c1c; margin-top: 20px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>NIVARA</h1>
          <p style="color: #94a3b8; font-size: 13px; margin-top: 4px;">Security Operations Center</p>
        </div>
        <div class="content">
          <h2>Password Reset Request</h2>
          <p>Dear <strong>${fullName || 'Officer'}</strong>,</p>
          <p>We received a request to reset the password for your NIVARA account.</p>
          
          <div class="btn-wrapper">
            <a href="${resetUrl}" class="btn" target="_blank">Reset Password</a>
          </div>

          <p class="notice">⏰ This password reset link expires in 15 minutes. If you did not initiate this request, please report it to your system administrator immediately.</p>
          
          <p style="font-size: 13px; color: #64748b; word-break: break-all;">
            Direct link: <a href="${resetUrl}">${resetUrl}</a>
          </p>
        </div>
        <div class="footer">
          <p>&copy; NIVARA Security & Governance Infrastructure.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  const info = await mailer.sendMail({
    from: env.MAIL_FROM,
    to,
    subject: 'NIVARA Password Reset Request',
    text: `Hello,\n\nA password reset was requested for your NIVARA account. Please visit:\n${resetUrl}\n\nThis link expires in 15 minutes.\n\nNIVARA Security Team`,
    html
  });

  return info;
};
