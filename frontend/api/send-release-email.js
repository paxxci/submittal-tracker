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
        <div style="font-family: sans-serif; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eaeaea; border-radius: 8px;">
          <h2 style="color: #10b981; margin-bottom: 24px;">Submittal Released for Production</h2>
          <p style="font-size: 16px; line-height: 1.5; margin-bottom: 24px;">${message.replace(/\n/g, '<br/>')}</p>
          <div style="background: #f9fafb; padding: 16px; border-radius: 6px; margin-bottom: 24px;">
            <p style="margin: 0; font-weight: 600;">Attached Document:</p>
            <p style="margin: 8px 0 0 0;">
              <a href="${attachmentUrl}" style="color: #3b82f6; text-decoration: none;">📄 ${attachmentName} (Download PDF)</a>
            </p>
          </div>
          <p style="font-size: 12px; color: #999; margin-top: 32px;">Sent securely via Submittal Tracker Pro.</p>
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
