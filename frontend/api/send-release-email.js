import { Resend } from 'resend';

export default async function handler(req, res) {
  // Add CORS headers for Vercel Serverless Function
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  if (!process.env.RESEND_API_KEY) {
    return res.status(500).json({ error: 'Resend API key missing on server' });
  }

  const resend = new Resend(process.env.RESEND_API_KEY);

  try {
    const { to, subject, message, attachmentName, attachmentUrl, submittalName, senderName, senderEmail } = req.body;

    const htmlContent = `
        <div style="font-family: 'Inter', sans-serif; background-color: #070d1a; color: #e2e8f0; max-width: 600px; margin: 0 auto; padding: 30px; border: 1px solid #1e4678; border-radius: 12px;">
          <h2 style="color: #00b4d8; margin-bottom: 24px; font-weight: 700; letter-spacing: -0.5px;">Submittal Released for Production</h2>
          <p style="font-size: 15px; line-height: 1.6; margin-bottom: 24px; color: #e2e8f0;">${message.replace(/\n/g, '<br/>')}</p>
          <div style="background-color: #0e1829; padding: 20px; border-radius: 8px; border: 1px solid #1e4678; margin-bottom: 24px;">
            <p style="margin: 0; font-weight: 600; color: #94a3b8; font-size: 13px; text-transform: uppercase; letter-spacing: 0.5px;">Attached Document</p>
            <p style="margin: 12px 0 0 0;">
              <a href="${attachmentUrl}" style="color: #00b4d8; text-decoration: none; font-weight: 600; display: inline-flex; align-items: center; gap: 8px;">
                📄 ${attachmentName} <span style="font-size: 12px; color: #94a3b8; font-weight: 400;">(Download PDF)</span>
              </a>
            </p>
          </div>
          <div style="border-top: 1px solid rgba(30, 70, 120, 0.45); padding-top: 24px; margin-top: 32px;">
            <p style="font-size: 12px; color: #475569; margin: 0;">Sent securely via <strong>Submittal Tracker Pro</strong>.</p>
          </div>
        </div>
    `;

    const { data, error } = await resend.emails.send({
      from: `"${senderName || 'Submittal Tracker Pro'}" <notifications@submittaltrackerpro.com>`,
      reply_to: senderEmail,
      to: [to],
      subject: subject || `Document: ${submittalName}`,
      html: htmlContent
    });

    if (error) {
      console.error("Resend Error:", error);
      return res.status(400).json({ error });
    }

    res.json({ success: true, data });
  } catch (err) {
    console.error("Server Error sending email:", err);
    res.status(500).json({ error: err.message });
  }
}
