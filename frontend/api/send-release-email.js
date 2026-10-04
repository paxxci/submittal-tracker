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
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eaeaea; border-radius: 10px;">
        <h2 style="color: #333;">Document Shared via Submittal Tracker</h2>
        <p style="color: #555; font-size: 16px;"><strong>${senderName}</strong> has shared a document with you regarding <strong>${submittalName}</strong>.</p>
        <div style="background-color: #f9f9f9; padding: 15px; border-left: 4px solid #4a90e2; margin: 20px 0;">
          <p style="margin: 0; color: #333; font-size: 15px; white-space: pre-wrap;">${message || 'No additional message provided.'}</p>
        </div>
        ${attachmentName && attachmentUrl ? `
        <div style="margin-top: 30px;">
          <a href="${attachmentUrl}" style="background-color: #4a90e2; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">
            Download: ${attachmentName}
          </a>
        </div>
        ` : ''}
        <p style="color: #999; font-size: 12px; margin-top: 40px; border-top: 1px solid #eaeaea; padding-top: 20px;">
          This is an automated message sent via Submittal Tracker Pro.
        </p>
      </div>
    `;

    const { data, error } = await resend.emails.send({
      from: `${senderName || 'Submittal Tracker Pro'} <notifications@submittaltrackerpro.com>`,
      reply_to: senderEmail,
      to: [to],
      subject: subject || `Submittal Document: ${submittalName}`,
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
