import React from 'react'
import { ArrowRight, ShieldCheck, Zap, Layers, BarChart, Cloud, Users, Smartphone, FileSpreadsheet, Bot, HardDrive } from 'lucide-react'

export default function LandingPage({ onLoginClick }) {
  return (
    <div style={{ background: 'var(--bg-base)', height: '100vh', color: 'var(--text)', overflowX: 'hidden', overflowY: 'auto' }}>
      
      {/* ── TOP NAV ── */}
      <nav style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '24px 48px', position: 'absolute', top: 0, left: 0, right: 0, zIndex: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, background: 'linear-gradient(135deg, var(--accent), var(--accent-dark))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, color: '#000', fontSize: 13, boxShadow: '0 0 16px rgba(0,180,216,0.4)' }}>
            ST
          </div>
          <span style={{ fontSize: 18, fontWeight: 800, letterSpacing: '-0.5px' }}>Submittal Tracker Pro</span>
        </div>
        <div>
          <button 
            onClick={onLoginClick}
            className="btn btn-primary" 
            style={{ padding: '10px 24px', fontSize: 14 }}
          >
            Sign In
          </button>
        </div>
      </nav>

      {/* ── HERO SECTION ── */}
      <section style={{ paddingTop: 160, paddingBottom: 100, textAlign: 'center', padding: '160px 24px 100px 24px', position: 'relative' }}>
        <div style={{ position: 'absolute', top: '-20%', left: '50%', transform: 'translateX(-50%)', width: 800, height: 800, background: 'radial-gradient(circle, rgba(0,180,216,0.15) 0%, transparent 60%)', zIndex: 0, pointerEvents: 'none' }} />
        
        <div style={{ position: 'relative', zIndex: 1, maxWidth: 900, margin: '0 auto' }}>
          <div style={{ display: 'inline-block', padding: '6px 16px', background: 'rgba(0,180,216,0.1)', border: '1px solid rgba(0,180,216,0.2)', borderRadius: 100, color: 'var(--accent)', fontSize: 12, fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 24 }}>
            The Future of Construction Admin
          </div>
          <h1 style={{ fontSize: 'clamp(40px, 5vw, 64px)', fontWeight: 900, letterSpacing: '-2px', lineHeight: 1.1, marginBottom: 24 }}>
            Stop chasing submittals.<br/>
            <span style={{ color: 'var(--accent)' }}>Start building.</span>
          </h1>
          <p style={{ fontSize: 18, color: 'var(--text-sub)', lineHeight: 1.6, maxWidth: 600, margin: '0 auto 40px' }}>
            The fastest, most intelligent way for Electrical Contractors and Project Managers to extract, track, and approve submittals.
          </p>
          <div style={{ display: 'flex', gap: 16, justifyContent: 'center' }}>
            <button onClick={onLoginClick} className="btn btn-primary" style={{ padding: '14px 32px', fontSize: 16, borderRadius: 8 }}>
              Get Started Now <ArrowRight size={18} />
            </button>
          </div>
        </div>

        {/* ── VIDEO PLAYER ── */}
        <div style={{ marginTop: 80, position: 'relative', zIndex: 1, maxWidth: 1000, margin: '80px auto 0' }}>
          <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 16, padding: 8, boxShadow: '0 20px 40px rgba(0,0,0,0.5)' }}>
            <div style={{ aspectRatio: '16/9', background: '#000', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', overflow: 'hidden' }}>
              <video 
                src="/demo.mov" 
                controls 
                autoPlay 
                muted 
                playsInline
                style={{ width: '100%', height: '100%', objectFit: 'contain' }}
              />
            </div>
          </div>
        </div>
      </section>

      {/* ── KEY FEATURES (PROS) ── */}
      <section style={{ padding: '100px 24px', background: 'var(--bg-surface)', borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 80 }}>
            <h2 style={{ fontSize: 36, fontWeight: 800, letterSpacing: '-1px', marginBottom: 16 }}>Built for Speed & Precision</h2>
            <p style={{ color: 'var(--text-sub)', fontSize: 16, maxWidth: 600, margin: '0 auto' }}>
              We engineered Submittal Tracker Pro from the ground up to automate the heavy lifting so you can focus on building the project.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 40 }}>
            
            <div style={{ display: 'flex', gap: 20 }}>
              <div style={{ width: 48, height: 48, background: 'rgba(0,180,216,0.1)', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent)', flexShrink: 0 }}>
                <Zap size={24} />
              </div>
              <div>
                <h4 style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>Spec Intel Extraction</h4>
                <p style={{ color: 'var(--text-muted)', lineHeight: 1.5 }}>Upload your spec book and our system instantly reads and extracts every required section automatically.</p>
              </div>
            </div>

            <div style={{ display: 'flex', gap: 20 }}>
              <div style={{ width: 48, height: 48, background: 'rgba(0,180,216,0.1)', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent)', flexShrink: 0 }}>
                <Bot size={24} />
              </div>
              <div>
                <h4 style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>AI Project Assistant</h4>
                <p style={{ color: 'var(--text-muted)', lineHeight: 1.5 }}>Chat with our intelligent AI to get instant feedback, analyze submittal data, and answer questions about anything in your project.</p>
              </div>
            </div>

            <div style={{ display: 'flex', gap: 20 }}>
              <div style={{ width: 48, height: 48, background: 'rgba(0,180,216,0.1)', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent)', flexShrink: 0 }}>
                <Users size={24} />
              </div>
              <div>
                <h4 style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>Real-Time Collaboration</h4>
                <p style={{ color: 'var(--text-muted)', lineHeight: 1.5 }}>Invite your team to view your live work log during meetings or instantly generate professional PDF reports for clients.</p>
              </div>
            </div>

            <div style={{ display: 'flex', gap: 20 }}>
              <div style={{ width: 48, height: 48, background: 'rgba(0,180,216,0.1)', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent)', flexShrink: 0 }}>
                <Layers size={24} />
              </div>
              <div>
                <h4 style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>Smart Version Control</h4>
                <p style={{ color: 'var(--text-muted)', lineHeight: 1.5 }}>Easily keep track of Rev 1, Rev 2, and the Official Approved Version with foolproof visual stamping so you never lose track.</p>
              </div>
            </div>

            <div style={{ display: 'flex', gap: 20 }}>
              <div style={{ width: 48, height: 48, background: 'rgba(0,180,216,0.1)', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent)', flexShrink: 0 }}>
                <Cloud size={24} />
              </div>
              <div>
                <h4 style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>Cloud Centralization</h4>
                <p style={{ color: 'var(--text-muted)', lineHeight: 1.5 }}>Keep everything in one secure place. When the job is done, you have a perfect, organized archive of all approved documents.</p>
              </div>
            </div>

            <div style={{ display: 'flex', gap: 20 }}>
              <div style={{ width: 48, height: 48, background: 'rgba(0,180,216,0.1)', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent)', flexShrink: 0 }}>
                <Smartphone size={24} />
              </div>
              <div>
                <h4 style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>Mobile & Tablet Friendly</h4>
                <p style={{ color: 'var(--text-muted)', lineHeight: 1.5 }}>Access your entire project portfolio seamlessly whether you are at your office desk or walking the job site with an iPad.</p>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ── THE PROBLEM WE SOLVE (CONS) ── */}
      <section style={{ padding: '100px 24px' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 60 }}>
            <h2 style={{ fontSize: 36, fontWeight: 800, letterSpacing: '-1px', marginBottom: 16 }}>The Old Way is Broken</h2>
            <p style={{ color: 'var(--text-sub)', fontSize: 16, maxWidth: 500, margin: '0 auto' }}>
              Managing submittals through manual spreadsheets and scattered folders costs you hours of wasted time and thousands in delays.
            </p>
          </div>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 24 }}>
            {[
              { 
                title: 'The Excel Nightmare', 
                desc: 'Ditch the clunky spreadsheets. Stop wasting hours fighting with broken formatting and ugly logs just to keep things looking halfway decent.',
                icon: <FileSpreadsheet size={32} />
              },
              { 
                title: 'Manual Data Entry', 
                desc: 'Stop spending hours manually typing out spec section names and numbers into spreadsheets. Let our system extract them instantly.',
                icon: <ShieldCheck size={32} />
              },
              { 
                title: 'The Desktop Graveyard', 
                desc: 'End the chaos of having Rev 1, Rev 2, and "Rev 2 Final" PDFs scattered across your downloads folder, desktop, and endless network drives.',
                icon: <HardDrive size={32} />
              },
              { 
                title: 'Lost in Limbo', 
                desc: 'When it takes months to get cut sheets back from suppliers, it is easy to forget where you left off. Stop guessing what your next move is.',
                icon: <Layers size={32} />
              }
            ].map((prob, i) => (
              <div key={i} style={{ background: 'var(--bg-elevated)', padding: 32, borderRadius: 12, border: '1px solid var(--border)' }}>
                <div style={{ color: 'var(--s-rejected)', marginBottom: 16 }}>{prob.icon}</div>
                <h3 style={{ fontSize: 20, fontWeight: 700, marginBottom: 12 }}>{prob.title}</h3>
                <p style={{ color: 'var(--text-sub)', lineHeight: 1.6 }}>{prob.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer style={{ background: 'var(--bg-surface)', padding: '40px 24px', borderTop: '1px solid var(--border)', textAlign: 'center' }}>
        <div style={{ color: 'var(--text-muted)', fontSize: 14 }}>
          &copy; {new Date().getFullYear()} Submittal Tracker Pro. All rights reserved.
        </div>
      </footer>

    </div>
  )
}
