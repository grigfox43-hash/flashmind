import nodemailer from 'nodemailer';

export default async function handler(req: any, res: any) {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { email, name, activationUrl } = req.body;

  if (!email || !activationUrl) {
    return res.status(400).json({ error: 'Email and activationUrl are required' });
  }

  const htmlContent = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #030712; color: #f8fafc; margin: 0; padding: 40px 20px; }
          .container { max-width: 540px; margin: 0 auto; background: #0f172a; border: 1px solid #334155; border-radius: 24px; padding: 32px; text-align: center; }
          .logo { font-size: 24px; font-weight: 800; color: #818cf8; margin-bottom: 24px; }
          .btn { display: inline-block; padding: 14px 28px; background: linear-gradient(135deg, #4f46e5, #9333ea); color: #ffffff !important; text-decoration: none; font-weight: 700; border-radius: 14px; margin: 24px 0; }
          .footer { font-size: 12px; color: #64748b; margin-top: 32px; border-top: 1px solid #1e293b; padding-top: 16px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="logo">⚡ FlashMind AI</div>
          <h2>Подтверждение регистрации</h2>
          <p>Здравствуйте, ${name || 'Студент'}!</p>
          <p>Вы начали регистрацию в сервисе FlashMind AI. Чтобы подтвердить ваш email и активировать доступ к личный кабинету, нажмите на кнопку ниже:</p>
          <a href="${activationUrl}" class="btn" target="_blank">Подтвердить мой Email</a>
          <p style="font-size: 12px; color: #94a3b8;">Или скопируйте ссылку в адресную строку браузера:<br><span style="color: #818cf8; word-break: break-all;">${activationUrl}</span></p>
          <div class="footer">Если вы не регистрировались на сайте FlashMind AI, просто проигнорируйте это письмо.</div>
        </div>
      </body>
    </html>
  `;

  // 1. Option A: Send via Brevo (Sendinblue) REST API
  const brevoApiKey = (process.env.BREVO_API_KEY || '').trim();
  if (brevoApiKey) {
    try {
      let verifiedSender = (process.env.BREVO_SENDER_EMAIL || process.env.SMTP_USER || '').trim();
      const senderName = process.env.BREVO_SENDER_NAME || 'FlashMind AI';

      // Automatically fetch verified sender email from user's Brevo account if not explicitly set
      if (!verifiedSender) {
        try {
          const sendersRes = await fetch('https://api.brevo.com/v3/senders', {
            method: 'GET',
            headers: {
              'accept': 'application/json',
              'api-key': brevoApiKey,
            },
          });
          if (sendersRes.ok) {
            const sendersData = await sendersRes.json();
            if (sendersData.senders && sendersData.senders.length > 0) {
              const activeSender = sendersData.senders.find((s: any) => s.active) || sendersData.senders[0];
              if (activeSender && activeSender.email) {
                verifiedSender = activeSender.email.trim();
              }
            }
          }
        } catch (e) {
          console.warn('Auto-fetch Brevo senders warning:', e);
        }
      }

      if (!verifiedSender) {
        verifiedSender = email;
      }

      const response = await fetch('https://api.brevo.com/v3/smtp/email', {
        method: 'POST',
        headers: {
          'accept': 'application/json',
          'api-key': brevoApiKey,
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          sender: { name: senderName, email: verifiedSender },
          to: [{ email: email, name: name || 'Студент' }],
          subject: '✉️ Подтверждение регистрации в FlashMind AI',
          htmlContent: htmlContent,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        console.error('Brevo API Error Details:', data);
        return res.status(200).json({
          success: false,
          error: data.message || 'Brevo API Error',
          details: data,
        });
      }

      return res.status(200).json({ success: true, provider: 'brevo', data });
    } catch (err: any) {
      console.error('Brevo API Error:', err);
      return res.status(200).json({ success: false, error: err.message });
    }
  }

  // 2. Option B: Send via Universal Free SMTP (Yandex / Mail.ru / Gmail)
  const smtpUser = process.env.SMTP_USER;
  const smtpPass = process.env.SMTP_PASS;
  const smtpHost = process.env.SMTP_HOST || 'smtp.yandex.ru';
  const smtpPort = Number(process.env.SMTP_PORT) || 465;

  if (smtpUser && smtpPass) {
    try {
      const transporter = nodemailer.createTransport({
        host: smtpHost,
        port: smtpPort,
        secure: smtpPort === 465,
        auth: {
          user: smtpUser,
          pass: smtpPass,
        },
      });

      await transporter.sendMail({
        from: `"FlashMind AI" <${smtpUser}>`,
        to: email,
        subject: '✉️ Подтверждение регистрации в FlashMind AI',
        html: htmlContent,
      });

      return res.status(200).json({ success: true, provider: 'smtp' });
    } catch (err: any) {
      console.error('SMTP Dispatch Error:', err);
      return res.status(200).json({
        success: false,
        error: `SMTP Error: ${err.message}`,
      });
    }
  }

  // 3. Option C: Send via Resend REST API
  const resendApiKey = process.env.RESEND_API_KEY;
  if (resendApiKey) {
    try {
      const fromAddress = process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev';
      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${resendApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: `FlashMind AI <${fromAddress}>`,
          to: [email],
          subject: '✉️ Подтверждение регистрации в FlashMind AI',
          html: htmlContent,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        return res.status(200).json({
          success: false,
          error: data.message || 'Resend API Restriction',
        });
      }

      return res.status(200).json({ success: true, provider: 'resend', data });
    } catch (err: any) {
      return res.status(200).json({ success: false, error: err.message });
    }
  }

  return res.status(200).json({
    success: false,
    error: 'Почтовый сервис подключается в Vercel.',
  });
}
