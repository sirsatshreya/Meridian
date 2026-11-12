import { EmailOutboxItem } from '../types';

export class EmailService {
  private outbox: EmailOutboxItem[] = [];

  constructor(initialOutbox: EmailOutboxItem[] = []) {
    this.outbox = initialOutbox;
  }

  public getOutbox(): EmailOutboxItem[] {
    return [...this.outbox].reverse();
  }

  public sendEmail(
    recipientEmail: string,
    subject: string,
    templateType: EmailOutboxItem['templateType'],
    payload: Record<string, any>
  ): EmailOutboxItem {
    const resendKey = process.env.RESEND_API_KEY;
    const hasResend = Boolean(resendKey && resendKey.startsWith('re_'));

    const item: EmailOutboxItem = {
      id: `eml-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`,
      recipientEmail,
      subject,
      templateType,
      payloadJson: payload,
      status: hasResend ? 'QUEUED' : 'SIMULATED_SENT',
      sentAtUtc: new Date().toISOString(),
      provider: hasResend
        ? 'Resend Transactional Email API'
        : 'Meridian Sandbox Outbox Adapter (Simulated / Demo)',
    };

    this.outbox.push(item);

    if (hasResend && resendKey) {
      const fromEmail = process.env.RESEND_FROM_EMAIL || 'Meridian Trade Systems <onboarding@resend.dev>';
      const htmlBody = `
        <div style="font-family: sans-serif; background: #08090A; color: #F5F5F2; padding: 24px; border-radius: 12px;">
          <h2 style="color: #D7FF43; margin-top: 0;">${subject}</h2>
          <p>Template: <strong>${templateType}</strong></p>
          <pre style="background: #111315; padding: 12px; border-radius: 8px; color: #999D9B; overflow: auto;">${JSON.stringify(payload, null, 2)}</pre>
          <p style="font-size: 12px; color: #999D9B;">Meridian Trade Systems — B2B Trade Orchestration</p>
        </div>
      `;

      fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${resendKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: fromEmail,
          to: [recipientEmail],
          subject,
          html: htmlBody,
        }),
      }).catch((err) => {
        console.warn('[MERIDIAN EMAIL] Resend dispatch error (outbox fallback preserved):', err?.message || err);
      });
    }

    return item;
  }
}
