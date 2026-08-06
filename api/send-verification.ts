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

  const apiKey = process.env.RESEND_API_KEY;

  if (!apiKey) {
    return res.status(200).json({
      success: false,
      error: 'RESEND_API_KEY environment variable is missing on Vercel.',
    });
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

  try {
    const fromAddress = process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev';

    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
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
      console.error('Resend API returned error:', data);
      return res.status(200).json({
        success: false,
        error: data.message || 'Resend error',
        details: data,
      });
    }

    return res.status(200).json({ success: true, resend: data });
  } catch (err: any) {
    console.error('Email Dispatch Error:', err);
    return res.status(500).json({ error: err.message || 'Failed to dispatch email' });
  }
}
