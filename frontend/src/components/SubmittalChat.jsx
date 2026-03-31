import React, { useState, useRef, useEffect, useCallback } from 'react'
import { X, Send, Bot, Sparkles, MessageSquare, ChevronRight, MessageCircle } from 'lucide-react'
import { getChatCompletion } from '../services/ai'

export default function SubmittalChat({ submittals = [], activityLogs = [], projectName }) {
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const scrollRef = useRef(null)

  // Initialize/Update first message when data arrives
  useEffect(() => {
    if (messages.length === 0 && submittals.length > 0) {
      setMessages([{ 
        id: 'initial', 
        role: 'assistant', 
        content: `Hello! I'm your Project Intelligence assistant. I've analyzed all ${submittals.length} submittals and their activity logs for **${projectName}**. Try asking about **overdue** items, **next steps**, or specific **activity log** notes!` 
      }])
    }
  }, [submittals.length, projectName, messages.length])

  useEffect(() => {
    if (scrollRef.current) {
        scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages, isTyping])

  const handleSend = useCallback(async (textOverride) => {
    const text = textOverride || input
    if (!text.trim()) return
    
    const userMsg = { id: Date.now(), role: 'user', content: text }
    setMessages(prev => [...prev, userMsg])
    setInput('')
    setIsTyping(true)

    try {
      // LIVE BRAIN (OpenRouter)
      const reply = await getChatCompletion(
        [...messages, userMsg], 
        submittals, 
        activityLogs, 
        projectName
      )
      setMessages(prev => [...prev, { id: Date.now() + 1, role: 'assistant', content: reply }])
    } catch (error) {
      console.error("AI Upgrade Failed, falling back to Local Logic:", error)
      // FALLBACK TO SIMULATED LOGIC
      let reply = ""
      const q = text.toLowerCase()
      
      if (q.includes('overdue')) {
        const items = submittals.filter(s => {
            const today = new Date().toISOString().split('T')[0]
            return s.due_date && s.due_date < today && !['approved', 'rejected'].includes(s.status)
        })
        reply = items.length > 0 
          ? `There are **${items.length} overdue** items. Priority focus: ${items.map(o => o.item_name).slice(0,3).join(', ')}.`
          : "Zero overdue submittals! This project is running on schedule."
      } else if (q.includes('approved')) {
        const approved = submittals.filter(s => s.status === 'approved')
        reply = `You have **${approved.length} approved submittals**! (${Math.round((approved.length / submittals.length) * 100)}% complete).`
      } else if (q.includes('bic') || q.includes('court') || q.includes('my turn')) {
        const myItems = submittals.filter(s => ['you', 'pm'].includes(s.bic?.toLowerCase()))
        reply = `The ball is in **your court** for **${myItems.length}** items. Most critical: ${myItems[0]?.item_name || 'None'}.`
      } else if (q.includes('priority')) {
        const high = submittals.filter(s => s.priority === 'high')
        const med = submittals.filter(s => s.priority === 'medium')
        reply = `Priority Check: **${high.length} High**, **${med.length} Medium**. ${high.length > 0 ? `Critical Focus: ${high[0].item_name}` : ''}`
      } else if (q.includes('capability') || q.includes('help')) {
        reply = "I'm having trouble connecting to my main brain, but I can still check **overdue** items, **priority**, and **revisions** locally."
      } else {
        reply = "I hit a connection snag. Try again or check your OpenRouter key!"
      }
      setMessages(prev => [...prev, { id: Date.now() + 1, role: 'assistant', content: reply }])
    } finally {
      setIsTyping(false)
    }
  }, [input, submittals, activityLogs, messages, projectName])

  return (
    <div className="floating-chat-container">
      {isOpen ? (
        <div className="chat-window animate-pop-up">
          <div className="detail-header" style={{ background: 'var(--bg-elevated)', borderBottom: '1px solid var(--border)', padding: '12px 16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div className="ai-icon-bg">
                <Sparkles size={16} />
              </div>
              <div>
                <div style={{ fontWeight: 800, fontSize: 13, letterSpacing: '0.5px' }}>PROJECT INTEL</div>
                <div style={{ fontSize: 10, color: 'var(--text-dim)', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: 4 }}>
                  <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#10b981' }} />
                  Gemini 2.0 Live
                </div>
              </div>
            </div>
            <button className="btn btn-icon" onClick={() => setIsOpen(false)}><X size={18} /></button>
          </div>

          <div className="chat-messages" ref={scrollRef}>
            {messages.map(m => (
              <div key={m.id} className={`chat-bubble-wrap ${m.role}`}>
                <div className={`chat-bubble ${m.role}`}>
                  {m.content}
                </div>
              </div>
            ))}
            {isTyping && (
              <div className="chat-bubble-wrap assistant">
                <div className="chat-bubble assistant typing">
                  <span className="dot" />
                  <span className="dot" />
                  <span className="dot" />
                </div>
              </div>
            )}
          </div>

          <div className="chat-input-wrap">
            <div className="chat-suggestions">
              <button onClick={() => handleSend('What can you do?')}>Capabilities?</button>
              <button onClick={() => handleSend('Is it my turn?')}>My Turn?</button>
              <button onClick={() => handleSend('Tell me what is overdue')}>Overdue?</button>
              <button onClick={() => handleSend('Give me high priority count')}>High Priority?</button>
            </div>
            <div className="chat-input-row">
              <input 
                placeholder="Ask project intel..."
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSend()}
              />
              <button className="btn btn-primary btn-icon" onClick={() => handleSend()} disabled={!input.trim()}>
                <Send size={16} />
              </button>
            </div>
          </div>
        </div>
      ) : (
        <button 
          className="chat-fab-button animate-pulse-glow"
          onClick={() => setIsOpen(true)}
          title="Open Project Intel"
        >
          <Sparkles size={24} />
          <div className="fab-label">Ask Intel</div>
        </button>
      )}

      <style>{`
        .floating-chat-container { position: fixed; bottom: 30px; right: 30px; z-index: 9999; pointer-events: auto; font-family: inherit; }
        
        .chat-fab-button {
          width: auto; height: 60px; padding: 0 24px; background: linear-gradient(135deg, var(--accent), #ff8c00);
          border-radius: 30px; display: flex; align-items: center; justify-content: center; gap: 12px;
          border: none; color: white; cursor: pointer; box-shadow: 0 8px 32px rgba(245,158,11,0.4);
          transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
        }
        .chat-fab-button:hover { transform: scale(1.05) translateY(-5px); box-shadow: 0 12px 40px rgba(245,158,11,0.5); }
        .fab-label { font-weight: 700; font-size: 14px; letter-spacing: 0.5px; }

        .chat-window {
          width: 380px; height: 500px; background: var(--bg-surface); border-radius: 20px;
          border: 1px solid var(--border); box-shadow: 0 12px 48px rgba(0,0,0,0.5);
          display: flex; flex-direction: column; overflow: hidden; margin-bottom: 20px;
        }

        .animate-pop-up { animation: popUp 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275); transform-origin: bottom right; }
        @keyframes popUp { 0% { transform: scale(0.5); opacity: 0; } 100% { transform: scale(1); opacity: 1; } }

        .ai-icon-bg { width: 32px; height: 32px; background: linear-gradient(135deg, var(--accent), #ff8c00); border-radius: 8px; display: flex; align-items: center; justify-content: center; color: white; }
        .chat-messages { flex: 1; overflow-y: auto; padding: 20px; display: flex; flex-direction: column; gap: 16px; scroll-behavior: smooth; }
        .chat-bubble-wrap { display: flex; width: 100%; }
        .chat-bubble-wrap.user { justify-content: flex-end; }
        .chat-bubble { max-width: 85%; padding: 10px 14px; border-radius: 14px; font-size: 13px; line-height: 1.5; position: relative; }
        .chat-bubble.assistant { background: var(--bg-elevated); color: var(--text); border-bottom-left-radius: 2px; border: 1px solid var(--border); }
        .chat-bubble.user { background: var(--accent); color: white; border-bottom-right-radius: 2px; }
        
        .chat-input-wrap { padding: 16px; border-top: 1px solid var(--border); background: var(--bg-elevated); }
        .chat-suggestions { display: flex; gap: 6px; margin-bottom: 12px; overflow-x: auto; padding-bottom: 4px; }
        .chat-suggestions button { 
          background: var(--bg-surface); border: 1px solid var(--border); color: var(--text-sub); 
          font-size: 11px; padding: 4px 10px; border-radius: 20px; cursor: pointer; white-space: nowrap; transition: all 0.2s;
        }
        .chat-suggestions button:hover { border-color: var(--accent); color: var(--text); }
        
        .chat-input-row { display: flex; gap: 8px; }
        .chat-input-row input { 
          flex: 1; background: var(--bg-surface); border: 1px solid var(--border); 
          border-radius: 8px; padding: 8px 12px; font-size: 13px; color: var(--text); outline: none;
        }
        .chat-input-row input:focus { border-color: var(--accent); }
        
        .typing .dot { height: 4px; width: 4px; background-color: var(--text-dim); border-radius: 50%; display: inline-block; animation: dotPulse 1.5s infinite ease-in-out; margin: 0 1px; }
        .typing .dot:nth-child(2) { animation-delay: 0.2s; }
        .typing .dot:nth-child(3) { animation-delay: 0.4s; }
        @keyframes dotPulse { 0%, 100% { transform: scale(0.5); opacity: 0.5; } 50% { transform: scale(1.1); opacity: 1; } }

        .animate-pulse-glow { animation: pulseGlow 3s infinite ease-in-out; }
        @keyframes pulseGlow {
          0% { box-shadow: 0 8px 32px rgba(245,158,11,0.4); }
          50% { box-shadow: 0 8px 45px rgba(245,158,11,0.6); }
          100% { box-shadow: 0 8px 32px rgba(245,158,11,0.4); }
        }
      `}</style>
    </div>
  )
}
