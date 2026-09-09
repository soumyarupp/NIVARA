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
  const directActivationUrl = `http://localhost:${env.PORT}/api/auth/activate?token=${encodeURIComponent(rawToken)}`;
  const isPlaceholderFrontend = !env.FRONTEND_URL || env.FRONTEND_URL === 'http://localhost:5001';
  const activationUrl = isPlaceholderFrontend
    ? directActivationUrl
    : `${env.FRONTEND_URL}/activate?token=${encodeURIComponent(rawToken)}`;

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
  const directResetUrl = `http://localhost:${env.PORT}/api/auth/reset-password?token=${encodeURIComponent(rawToken)}`;
  const isPlaceholderFrontend = !env.FRONTEND_URL || env.FRONTEND_URL === 'http://localhost:3000';
  const resetUrl = isPlaceholderFrontend
    ? directResetUrl
    : `${env.FRONTEND_URL}/reset-password?token=${encodeURIComponent(rawToken)}`;

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

/**
 * Send High/Critical Risk Early Warning Alert Email
 */
export const sendAlertNotificationEmail = async ({
  to,
  recipientName = 'Officer',
  projectTitle = 'Infrastructure Project',
  alertTitle = 'Risk Alert',
  alertMessage = '',
  severity = 'HIGH',
  riskScore = 0
}) => {
  try {
    const mailer = await getTransporter();
    const severityColor = severity === 'CRITICAL' ? '#991b1b' : '#c2410c';

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 0; color: #0f172a; }
          .container { max-width: 600px; margin: 24px auto; background: #ffffff; border-radius: 8px; border: 1px solid #e2e8f0; overflow: hidden; }
          .header { background: #0f172a; color: #ffffff; padding: 20px 24px; }
          .badge { display: inline-block; padding: 4px 10px; border-radius: 4px; font-weight: bold; font-size: 12px; color: #ffffff; background: ${severityColor}; }
          .content { padding: 24px; }
          .card { background: #f8fafc; border-left: 4px solid ${severityColor}; padding: 16px; margin: 16px 0; border-radius: 0 6px 6px 0; }
          .footer { background: #f1f5f9; padding: 16px 24px; font-size: 12px; color: #64748b; text-align: center; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h2 style="margin: 0;">🏛️ NIVARA Early Warning System</h2>
            <p style="margin: 4px 0 0 0; color: #94a3b8; font-size: 13px;">MoSPI / IPMD Project Monitoring Infrastructure</p>
          </div>
          <div class="content">
            <span class="badge">${severity} RISK ALERT</span>
            <h3 style="margin: 12px 0 6px 0;">${alertTitle}</h3>
            <p style="color: #475569; font-size: 14px;"><strong>Project:</strong> ${projectTitle}</p>
            <p style="color: #475569; font-size: 14px;"><strong>Calculated Risk Score:</strong> ${riskScore} / 100</p>
            
            <div class="card">
              <p style="margin: 0; font-size: 14px; line-height: 1.5;">${alertMessage}</p>
            </div>

            <p style="font-size: 13px; color: #64748b;">
              Dear <strong>${recipientName}</strong>, as the assigned Nodal / Ministry Officer, please review this issue on the NIVARA Dashboard and coordinate necessary remediation steps.
            </p>
          </div>
          <div class="footer">
            <p style="margin: 0;">This is an automated system notification from the NIVARA Project Monitoring Platform.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const info = await mailer.sendMail({
      from: env.MAIL_FROM,
      to,
      subject: `[NIVARA ${severity} ALERT] ${projectTitle}: ${alertTitle}`,
      text: `NIVARA ALERT [${severity}]\nProject: ${projectTitle}\nRisk Score: ${riskScore}\n\n${alertTitle}\n${alertMessage}\n\nPlease review on NIVARA portal.`,
      html
    });

    return info;
  } catch (err) {
    console.error(`⚠️ Failed to dispatch alert email to ${to}:`, err.message);
    return null;
  }
};

