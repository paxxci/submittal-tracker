import React, { useState } from 'react'
import {
  LayoutDashboard, List, Settings, Bell, Plus,
  Building2, Search, ChevronRight, Flag, Clock,
  CheckCircle2, AlertCircle, RotateCcw, Circle
} from 'lucide-react'

// ─────────────────────────────────────
// HELPERS
// ─────────────────────────────────────
const STATUS_CONFIG = {
  pending:    { label: 'Pending',            badge: 'badge-gray',   dot: 'pending' },
  submitted:  { label: 'Submitted',          badge: 'badge-blue',   dot: 'submitted' },
  review:     { label: 'Under Review',       badge: 'badge-yellow', dot: 'review' },
  approved:   { label: 'Approved',           badge: 'badge-green',  dot: 'approved' },
  noted:      { label: 'Approved as Noted',  badge: 'badge-yellow', dot: 'review' },
  revise:     { label: 'Revise & Resubmit',  badge: 'badge-orange', dot: 'revise' },
  rejected:   { label: 'Rejected',           badge: 'badge-red',    dot: 'rejected' },
}

const BIC_CONFIG = {
  you:       { label: 'You',         cls: 'you' },
  vendor:    { label: 'Vendor',      cls: 'vendor' },
  gc:        { label: 'GC',          cls: 'gc' },
  engineer:  { label: 'Engineer',    cls: 'engineer' },
  architect: { label: 'Architect',   cls: 'architect' },
}

// ─────────────────────────────────────
// APP
// ─────────────────────────────────────
export default function App() {
  const [view, setView] = useState('dashboard')

  return (
    <div className="app-shell bg-bg-deep">
      {/* Nav Rail */}
      <nav className="nav-rail">
        <div style={{ width: 32, height: 32, borderRadius: 10, background: 'var(--accent-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: 14, color: '#000', marginBottom: 8 }}>ST</div>
        <button className={`btn-icon ${view === 'dashboard' ? 'active' : ''}`} onClick={() => setView('dashboard')} title="Dashboard"><LayoutDashboard size={20} /></button>
        <button className={`btn-icon ${view === 'tracker' ? 'active' : ''}`} onClick={() => setView('tracker')} title="Tracker"><List size={20} /></button>
        <button className={`btn-icon ${view === 'settings' ? 'active' : ''}`} onClick={() => setView('settings')} title="Settings" style={{ marginTop: 'auto' }}><Settings size={20} /></button>
      </nav>

      {/* Main */}
      <div className="main-stage">
        {/* Top Bar */}
        <div className="top-bar">
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 12 }}>
            <Search size={16} style={{ color: 'var(--text-muted)' }} />
            <input placeholder="Search submittals, spec sections, vendors..." style={{ background: 'none', border: 'none', outline: 'none', color: 'var(--text-main)', fontSize: 13, width: 340 }} />
          </div>
          <button className="btn-icon"><Bell size={18} /></button>
          <button className="btn-primary" style={{ padding: '7px 16px', fontSize: 12 }}>
            <Plus size={14} /> New Submittal
          </button>
        </div>

        {/* Stage Body */}
        <div className="stage-body custom-scrollbar animate-fade-in">
          <h1 style={{ fontSize: 28, fontWeight: 900, letterSpacing: '-0.5px', marginBottom: 4 }}>Submittal Tracker</h1>
          <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 32 }}>Real-time submittal status, ball-in-court tracking, and vendor accountability.</p>

          {/* Coming Soon placeholder */}
          <div className="prism-card" style={{ textAlign: 'center', padding: 64 }}>
            <div style={{ width: 64, height: 64, borderRadius: 20, background: 'rgba(255,107,0,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
              <List size={32} style={{ color: 'var(--accent-primary)' }} />
            </div>
            <h2 style={{ fontSize: 22, fontWeight: 800, marginBottom: 8 }}>Tracker is being built</h2>
            <p style={{ color: 'var(--text-muted)', fontSize: 14, maxWidth: 400, margin: '0 auto' }}>
              Design system loaded. Data model is being planned. The full tracker UI is coming next.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
