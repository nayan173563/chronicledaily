import nodemailer from 'nodemailer';
import { SmtpSettings } from '../src/types';

export async function testSmtpConnection(
  config: SmtpSettings
): Promise<{ success: boolean; message: string; latencyMs: number }> {
  const startTime = Date.now();
  if (!config.host || !config.port) {
    return {
      success: false,
      message: 'SMTP Host and Port are required to test connection',
      latencyMs: 0
    };
  }

  try {
    const isSecure = config.encryption === 'ssl' || Number(config.port) === 465;
    const transporter = nodemailer.createTransport({
      host: config.host.trim(),
      port: Number(config.port),
      secure: isSecure,
      auth: config.username ? {
        user: config.username.trim(),
        pass: config.password || ''
      } : undefined,
      tls: {
        rejectUnauthorized: false
      },
      connectionTimeout: 10000,
      greetingTimeout: 5000,
      socketTimeout: 10000
    });

    await transporter.verify();
    const latencyMs = Date.now() - startTime;
    return {
      success: true,
      message: `Successfully connected to SMTP server ${config.host}:${config.port} via ${config.encryption.toUpperCase()} in ${latencyMs}ms. Authentication verified.`,
      latencyMs
    };
  } catch (err: any) {
    const latencyMs = Date.now() - startTime;
    return {
      success: false,
      message: `SMTP connection failed: ${err.message || 'Unable to connect to host'}`,
      latencyMs
    };
  }
}

export async function sendTestEmail(
  config: SmtpSettings,
  toEmail: string
): Promise<{ success: boolean; message: string; messageId?: string }> {
  if (!toEmail || !toEmail.includes('@')) {
    return {
      success: false,
      message: 'A valid recipient email address is required'
    };
  }

  if (!config.host || !config.port) {
    return {
      success: false,
      message: 'SMTP Host and Port must be configured first'
    };
  }

  try {
    const isSecure = config.encryption === 'ssl' || Number(config.port) === 465;
    const transporter = nodemailer.createTransport({
      host: config.host.trim(),
      port: Number(config.port),
      secure: isSecure,
      auth: config.username ? {
        user: config.username.trim(),
        pass: config.password || ''
      } : undefined,
      tls: {
        rejectUnauthorized: false
      },
      connectionTimeout: 15000
    });

    const fromAddress = `"${config.from_name || 'Chronicle Daily'}" <${config.from_email || config.username || 'noreply@chronicle-daily.org'}>`;

    const info = await transporter.sendMail({
      from: fromAddress,
      to: toEmail.trim(),
      subject: `[Chronicle Daily] SMTP Verification Test Email`,
      text: `Hello,\n\nThis is a verified test email sent from your Chronicle Daily editorial publication platform.\n\nConfiguration Details:\n- SMTP Host: ${config.host}\n- Port: ${config.port}\n- Encryption: ${config.encryption}\n- Sent at: ${new Date().toUTCString()}\n\nYour outbound email delivery system is functioning correctly.`,
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e5e7eb; border-radius: 8px; overflow: hidden; background-color: #ffffff;">
          <div style="background-color: #0f172a; padding: 24px; color: #ffffff; text-align: center;">
            <h2 style="margin: 0; font-family: Georgia, serif; font-size: 24px; letter-spacing: 0.5px;">The Daily Chronicle</h2>
            <p style="margin: 6px 0 0 0; font-size: 12px; color: #94a3b8; text-transform: uppercase; letter-spacing: 1px;">Editorial Outbound Mail Gateway</p>
          </div>
          <div style="padding: 24px; background-color: #ffffff; color: #334155; line-height: 1.6;">
            <p style="font-size: 15px; margin-top: 0;">Hello,</p>
            <p style="font-size: 14px;">This is a test email confirming that your <strong>SMTP Email Server</strong> has been configured and is successfully dispatching messages from Chronicle Daily.</p>
            <div style="background-color: #f8fafc; border-left: 4px solid #10b981; padding: 14px 18px; margin: 20px 0; border-radius: 0 6px 6px 0;">
              <p style="margin: 0; font-size: 13px; font-weight: 600; color: #065f46;">Connection Status: Verified Active</p>
              <p style="margin: 4px 0 0 0; font-size: 12px; color: #475569; font-family: monospace;">Host: ${config.host}:${config.port} (${config.encryption.toUpperCase()})</p>
              <p style="margin: 2px 0 0 0; font-size: 12px; color: #475569; font-family: monospace;">Sender: ${fromAddress}</p>
            </div>
            <p style="font-size: 12px; color: #64748b; margin-bottom: 0;">Sent at: ${new Date().toISOString()}</p>
          </div>
        </div>
      `
    });

    return {
      success: true,
      message: `Test email successfully dispatched to ${toEmail}. Message ID: ${info.messageId}`,
      messageId: info.messageId
    };
  } catch (err: any) {
    return {
      success: false,
      message: `Failed to send test email: ${err.message || 'SMTP transport error'}`
    };
  }
}

export async function sendPasswordResetOtpEmail(
  config: SmtpSettings,
  toEmail: string,
  otpCode: string,
  expiresMinutes: number = 10
): Promise<{ success: boolean; message: string; messageId?: string }> {
  if (!toEmail || !toEmail.includes('@')) {
    return {
      success: false,
      message: 'A valid recipient email address is required'
    };
  }

  if (!config.host || !config.port) {
    return {
      success: false,
      message: 'SMTP Host and Port must be configured first'
    };
  }

  try {
    const isSecure = config.encryption === 'ssl' || Number(config.port) === 465;
    const transporter = nodemailer.createTransport({
      host: config.host.trim(),
      port: Number(config.port),
      secure: isSecure,
      auth: config.username ? {
        user: config.username.trim(),
        pass: config.password || ''
      } : undefined,
      tls: {
        rejectUnauthorized: false
      },
      connectionTimeout: 10000,
      greetingTimeout: 5000,
      socketTimeout: 10000
    });

    const fromAddress = `"${config.from_name || 'The Daily Chronicle Security'}" <${config.from_email || config.username || 'security@chronicle-daily.org'}>`;

    const info = await transporter.sendMail({
      from: fromAddress,
      to: toEmail.trim(),
      subject: `[Chronicle Daily] ${otpCode} is your Password Reset Verification Code`,
      text: `Hello,\n\nA password reset request was initiated for your Chronicle Daily editorial administrator account.\n\nYour One-Time Verification Code is: ${otpCode}\n\nThis security code is strictly valid for ${expiresMinutes} minutes.\nIf you did not initiate this request, please review your account credentials immediately.`,
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 540px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 10px; overflow: hidden; background-color: #ffffff; box-shadow: 0 4px 12px rgba(0,0,0,0.05);">
          <div style="background-color: #09090b; padding: 24px; color: #ffffff; text-align: center;">
            <h2 style="margin: 0; font-family: Georgia, serif; font-size: 22px; letter-spacing: 0.5px;">The Daily Chronicle</h2>
            <p style="margin: 6px 0 0 0; font-size: 11px; color: #ef4444; font-weight: 700; text-transform: uppercase; letter-spacing: 1.5px;">Admin Security Gate</p>
          </div>
          <div style="padding: 26px 24px; color: #1e293b; line-height: 1.6;">
            <p style="font-size: 15px; margin-top: 0; font-weight: 600;">Security Challenge</p>
            <p style="font-size: 14px; color: #475569;">A request was received to reset the administrator credentials for your Chronicle Daily portal.</p>
            
            <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 22px; text-align: center; margin: 22px 0;">
              <span style="font-size: 11px; text-transform: uppercase; letter-spacing: 1.2px; color: #64748b; font-weight: 600;">Your One-Time Security Code</span>
              <div style="font-family: 'SF Mono', Menlo, Consolas, monospace; font-size: 34px; font-weight: 800; letter-spacing: 8px; color: #0f172a; margin-top: 10px;">${otpCode}</div>
              <p style="font-size: 12px; color: #dc2626; font-weight: 600; margin: 10px 0 0 0;">⏱ Expires in ${expiresMinutes} minutes</p>
            </div>

            <p style="font-size: 12px; color: #64748b; margin-bottom: 0;">If you did not request this code, no changes have been made to your credentials. You can safely ignore this notification.</p>
          </div>
          <div style="background-color: #f1f5f9; border-top: 1px solid #e2e8f0; padding: 14px; text-align: center; font-size: 11px; color: #94a3b8;">
            Chronicle Daily Editorial Publishing System • Secured Session
          </div>
        </div>
      `
    });

    return {
      success: true,
      message: `Verification code successfully dispatched to ${toEmail}`,
      messageId: info.messageId
    };
  } catch (err: any) {
    return {
      success: false,
      message: `SMTP dispatch error: ${err.message || 'Unable to send email'}`
    };
  }
}
