const OPENROUTER_API_KEY = import.meta.env.VITE_OPENROUTER_API_KEY;
const MODEL = "google/gemini-2.0-flash-001";

export async function getChatCompletion(messages, submittals, activityLogs, projectName) {
  if (!OPENROUTER_API_KEY) {
    throw new Error("OpenRouter API key is missing. Please add VITE_OPENROUTER_API_KEY to your .env file.");
  }

  // Prepare data context for the AI
  const submittalContext = submittals.map(s => `
- Item: ${s.item_name}
  Spec Section: ${s.spec_sections?.csi_code || 'N/A'}
  Status: ${s.status}
  Ball In Court (BIC): ${s.bic || 'N/A'}
  Priority: ${s.priority}
  Submitted Date: ${s.submitted_date || 'Not Submitted'}
  Expected Return: ${s.due_date || 'N/A'}
  Next Action: ${s.next_action || 'None'}
  Revision: ${s.round || 1}
`).join('\n');

  // Prepare recent activity context (Leveraging Gemini 2.0 Flash's massive context window)
  const logContext = activityLogs.slice(-5000).map(l => {
    const sub = submittals.find(s => s.id === l.submittal_id);
    let msg = l.message;
    
    // Clean up raw data to match UI display strings
    if (typeof msg !== 'string' || !msg.trim().startsWith('{')) {
      // It's a regular string, apply regex formatting
      msg = msg.replace(/📤 PDF "(.+?)" \(Revision (\d+)\) was submitted/, 'Submittal: Submitted - Rev $2 "$1"');
      msg = msg.replace(/📤 OFFICIAL SUBMISSION FILED \(Revision (\d+)\)/, 'Submittal: Submitted - Rev $1 (No File)');
      msg = msg.replace(/\[R(\d+)\] Submittal Document uploaded: "(.+?)"/, 'Submittal: Uploaded - Rev $1 "$2"');
      msg = msg.replace(/O&M Document uploaded: "(.+?)"/, 'O&M Document: Uploaded - "$1"');
      msg = msg.replace(/Reference File uploaded: "(.+?)"/, 'Reference File: Uploaded - "$1"');
      msg = msg.replace(/🔄 Re-classified "(.+?)" to Revision (\d+)/, 'Submittal: Changed to Rev $2 "$1"');
      msg = msg.replace(/✅ Stamped \[R(\d+)\] "(.+?)" as Officially Approved Version/, 'Submittal: Approved - Rev $1 "$2"');
      msg = msg.replace(/⏪ Revoked Approval Stamp from \[R(\d+)\] "(.+?)"/, 'Submittal: Revoked Approval - Rev $1 "$2"');
      msg = msg.replace(/🗑️ Deleted Document: "(.+?)"/, 'Document: Deleted - "$1"');
      msg = msg.replace(/🚀 Submittal Bumped to Revision (\d+)/, 'Submittal: Bumped to Rev $1');
      msg = msg.replace(/🚀 Submittal Revision manually set to (\d+)/, 'Submittal: Revision Override to Rev $1');
      msg = msg.replace(/Created submittal: (.+)/, 'Submittal: Created - "$1"');
      msg = msg.replace(/^(?:🎯|📤|📎|📕|🔗|🔄|✅|⏪|🗑️|🚀|🆕)\s*/, '');
    } else {
      try {
        const p = JSON.parse(msg);
        msg = 'Legacy System Action';
      } catch { }
    }

    if (msg.includes('Auto-Audit:')) return null;

    return `[${new Date(l.created_at).toLocaleString()}] ${sub ? sub.item_name : 'System'}: ${msg}`;
  }).filter(Boolean).join('\n');

  const systemPrompt = `
You are "Ask Intel", a premium project intelligence assistant for a Submittal Tracker application.
Current Project: ${projectName}

CONTEXT DATA:
Below is the current state of all submittals and the recent activity log for this project.

SUBMITTALS:
${submittalContext}

RECENT ACTIVITY LOG (Newest messages at bottom):
${logContext}

GOALS & INSTRUCTIONS:
1. Answer user questions about submittal status, spec sections, priorities, uploads, and next actions.
2. The log is formatted strictly. Look for keywords like "Submittal: Uploaded", "O&M Document: Uploaded", "Submittal: Approved", "Submittal: Submitted", etc.
3. Help the user identify bottlenecks (e.g., items in their court) and exact times actions occurred.
4. Be professional, concise, and helpful. 
5. If asked about a specific item, use the context to provide the most accurate status and timeline.
6. If the user asks "What model are you?", respond that you are a "Gemini 2.0 Live Brain".

FORMATTING:
Use markdown for bolding critical info. Keep responses short and actionable.
`;

  try {
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${OPENROUTER_API_KEY}`,
        "HTTP-Referer": "http://localhost:5174",
        "X-Title": "Submittal Tracker Intel",
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: MODEL,
        messages: [
          { role: "system", content: systemPrompt },
          ...messages.map(m => ({ role: m.role, content: m.content }))
        ]
      })
    });

    if (!response.ok) {
      const errData = await response.json();
      throw new Error(errData.error?.message || "Failed to fetch from OpenRouter");
    }

    const data = await response.json();
    return data.choices[0].message.content;
  } catch (error) {
    console.error("AI Service Error:", error);
    throw error;
  }
}

export async function callAI(prompt) {
  if (!OPENROUTER_API_KEY) {
    throw new Error("OpenRouter API key is missing.");
  }
  try {
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${OPENROUTER_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: MODEL,
        messages: [{ role: "user", content: prompt }]
      })
    });
    const data = await response.json();
    return data.choices[0].message.content;
  } catch (error) {
    console.error("AI callAI Error:", error);
    throw error;
  }
}

export async function extractSubmittalMetadata(text) {
  if (!OPENROUTER_API_KEY) throw new Error("OpenRouter API key is missing.");
  
  const prompt = `
    You are a construction submittal expert. 
    Extract the following metadata from this product cutsheet text. 
    Return ONLY a JSON object with these keys: "spec_section", "item_name", "manufacturer", "model", "revision".
    - spec_section (clean CSI code like 08 11 00)
    - item_name (clear descriptive name like "Hollow Metal Doors")
    - manufacturer (like "Assa Abloy" or "Schlage")
    - model (part # or series)
    - revision (number like 1, 2, or 3)
    
    If you cannot find a field, use null.
    Text:
    ${text.slice(0, 5000)}
  `;

  try {
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${OPENROUTER_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: MODEL,
        messages: [{ role: "user", content: prompt }]
      })
    });
    const data = await response.json();
    const cleanStr = data.choices[0].message.content.match(/\{[\s\S]*\}/)?.[0] || '{}';
    return JSON.parse(cleanStr);
  } catch (error) {
    console.error("AI Extraction Error:", error);
    return {};
  }
}
