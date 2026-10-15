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
