const OPENROUTER_API_KEY = import.meta.env.VITE_OPENROUTER_API_KEY;
const MODEL = "google/gemini-2.0-flash-001";

export async function getChatCompletion(messages, submittals, activityLogs, projectName) {
  if (!OPENROUTER_API_KEY) {
    throw new Error("OpenRouter API key is missing. Please add VITE_OPENROUTER_API_KEY to your .env file.");
  }

  // Prepare data context for the AI
  const submittalContext = submittals.map(s => `
- Item: ${s.item_name}
  Spec Section: ${s.spec_section || 'N/A'}
  Status: ${s.status}
  Ball In Court (BIC): ${s.bic || 'N/A'}
  Priority: ${s.priority}
  Due Date: ${s.due_date || 'N/A'}
  Next Action: ${s.next_action || 'None'}
  Revision: ${s.round || 1}
`).join('\n');

  // Prepare recent activity context (last 20 logs for token efficiency)
  const logContext = activityLogs.slice(0, 20).map(l => {
    const sub = submittals.find(s => s.id === l.submittal_id);
    return `[${new Date(l.created_at).toLocaleDateString()}] ${sub ? sub.item_name : 'System'}: ${l.message} (${l.author})`;
  }).join('\n');

  const systemPrompt = `
You are "Ask Intel", a premium project intelligence assistant for a Submittal Tracker application.
Current Project: ${projectName}

CONTEXT DATA:
Below is the current state of all submittals and the recent activity log for this project.

SUBMITTALS:
${submittalContext}

RECENT ACTIVITY LOG:
${logContext}

GOALS:
1. Answer user questions about submittal status, spec sections, priorities, and next actions.
2. Help the user identify bottlenecks (e.g., items in their court).
3. Be professional, concise, and helpful. 
4. If asked about a specific item, use the context to provide the most accurate status.
5. If the user asks "What model are you?", respond that you are a "Gemini 2.0 Live Brain".

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
