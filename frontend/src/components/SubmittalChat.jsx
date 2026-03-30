import React, { useState, useRef, useEffect } from 'react'
import { X, Send, Bot, Sparkles, MessageSquare, ChevronRight } from 'lucide-react'

export default function SubmittalChat({ submittals, projectName, onClose }) {
  const [messages, setMessages] = useState([
    { 
      id: 1, 
      role: 'assistant', 
      content: `Hello! I'm your Project Intelligence assistant. I've analyzed all ${submittals.length} submittals for **${projectName}**. How can I help you today?` 
    }
  ])
  const [input, setInput] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const scrollRef = useRef(null)

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight
  }, [messages, isTyping])

  const handleSend = async () => {
    if (!input.trim()) return
    const userMsg = { id: Date.now(), role: 'user', content: input }
    setMessages(prev => [...prev, userMsg])
    setInput('')
    setIsTyping(true)

    // Simulate AI Logic (Real Gemini implementation will go here)
    setTimeout(() => {
      let reply = ""
      const q = input.toLowerCase()
      
      if (q.includes('overdue')) {
        const overdue = submittals.filter(s => {
            const today = new Date().toISOString().split('T')[0]
            return s.due_date && s.due_date < today && !['approved', 'rejected'].includes(s.status)
        })
        reply = overdue.length > 0 
          ? `There are **${overdue.length} overdue submittals**. Key items include: ${overdue.slice(0,3).map(o => o.item_name).join(', ')}.`
          : "Great news! No submittals are currently overdue for this project."
      } else if (q.includes('approved')) {
        const approved = submittals.filter(s => s.status === 'approved')
        reply = `You have **${approved.length} approved submittals**, which is ${Math.round((approved.length / submittals.length) * 100)}% of the total project.`
      } else if (q.includes('bic') || q.includes('court')) {
        const myItems = submittals.filter(s => ['you', 'pm'].includes(s.bic?.toLowerCase()))
        reply = `The ball is in **your court** for **${myItems.length} items**. You should prioritize these to keep the schedule moving.`
      } else {
        reply = "I'm project intelligence. Ask me about overdue items, current approvals, or who has the ball in their court!"
      }

      setMessages(prev => [...prev, { id: Date.now() + 1, role: 'assistant', content: reply }])
      setIsTyping(false)
    }, 1200)
  }

  return (
    <div className="detail-panel chat-panel animate-in-right">
      <div className="detail-header" style={{ background: 'var(--bg-elevated)', borderBottom: '1px solid var(--border)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div className="ai-icon-bg">
            <Sparkles size={16} />
          </div>
          <div>
            <div style={{ fontWeight: 800, fontSize: 13, letterSpacing: '0.5px' }}>PROJECT INTEL</div>
            <div style={{ fontSize: 10, color: 'var(--text-dim)', textTransform: 'uppercase' }}>Gemini Powered</div>
          </div>
        </div>
        <button className="btn btn-icon" onClick={onClose}><X size={18} /></button>
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
          <button onClick={() => setInput('What is overdue?')}>Overdue?</button>
          <button onClick={() => setInput('Who has the ball?')}>My Turn?</button>
          <button onClick={() => setInput('Summary of approvals')}>Approvals</button>
        </div>
        <div className="chat-input-row">
          <input 
            placeholder="Ask anything about this project..."
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSend()}
          />
          <button className="btn btn-primary btn-icon" onClick={handleSend} disabled={!input.trim()}>
            <Send size={16} />
          </button>
        </div>
      </div>

      <style>{`
        .chat-panel { width: 380px; display: flex; flex-direction: column; background: var(--bg-surface); z-index: 1000; }
        .ai-icon-bg { width: 32px; height: 32px; background: linear-gradient(135deg, var(--accent), #ff8c00); border-radius: 8px; display: flex; alignItems: center; justifyContent: center; color: white; }
        .chat-messages { flex: 1; overflow-y: auto; padding: 20px; display: flex; flex-direction: column; gap: 16px; scroll-behavior: smooth; }
        .chat-bubble-wrap { display: flex; width: 100%; }
        .chat-bubble-wrap.user { justify-content: flex-end; }
        .chat-bubble { max-width: 85%; padding: 10px 14px; border-radius: 14px; font-size: 13px; line-height: 1.5; position: relative; }
        .chat-bubble.assistant { background: var(--bg-elevated); color: var(--text); border-bottom-left-radius: 2px; border: 1px solid var(--border); }
        .chat-bubble.user { background: var(--accent); color: white; border-bottom-right-radius: 2px; }
        
        .chat-input-wrap { padding: 16px; border-top: 1px solid var(--border); background: var(--bg-surface); }
        .chat-suggestions { display: flex; gap: 6px; margin-bottom: 12px; overflow-x: auto; padding-bottom: 4px; }
        .chat-suggestions button { 
          background: var(--bg-elevated); border: 1px solid var(--border); color: var(--text-sub); 
          font-size: 11px; padding: 4px 10px; border-radius: 20px; cursor: pointer; white-space: nowrap; transition: all 0.2s;
        }
        .chat-suggestions button:hover { border-color: var(--accent); color: var(--text); }
        
        .chat-input-row { display: flex; gap: 8px; }
        .chat-input-row input { 
          flex: 1; background: var(--bg-elevated); border: 1px solid var(--border); 
          border-radius: 8px; padding: 8px 12px; font-size: 13px; color: var(--text); outline: none;
        }
        .chat-input-row input:focus { border-color: var(--accent); }
        
        .typing .dot { height: 4px; width: 4px; background-color: var(--text-dim); border-radius: 50%; display: inline-block; animation: dotPulse 1.5s infinite ease-in-out; margin: 0 1px; }
        .typing .dot:nth-child(2) { animation-delay: 0.2s; }
        .typing .dot:nth-child(3) { animation-delay: 0.4s; }
        @keyframes dotPulse { 0%, 100% { transform: scale(0.5); opacity: 0.5; } 50% { transform: scale(1.1); opacity: 1; } }
      `}</style>
    </div>
  )
}
