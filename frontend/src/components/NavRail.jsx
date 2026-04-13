import React from 'react'
import { LayoutDashboard, FolderOpen, Settings, Cpu, LogOut, Shield } from 'lucide-react'
import { supabase } from '../supabase_client'

export default function NavRail({ view, setView, currentProject, goToDashboard, userEmail, onLogoutRequest, activeUserRole }) {
  const handleLogout = async () => {
    onLogoutRequest()
  }

  const userInitial = userEmail?.[0].toUpperCase() || '?'
  const isAdmin = activeUserRole === 'admin'

  return (
    <nav className="nav-rail">
      <div className="nav-logo">ST</div>

      <button
        className={`nav-btn ${view === 'dashboard' ? 'active' : ''}`}
        onClick={goToDashboard}
        id="nav-dashboard"
      >
        <LayoutDashboard size={18} />
        <span className="nav-tooltip">Dashboard</span>
      </button>

      {currentProject && (
        <button
          className={`nav-btn ${view === 'project' ? 'active' : ''}`}
          onClick={() => setView('project')}
          id="nav-project"
        >
          <FolderOpen size={18} />
          <span className="nav-tooltip">Workbench</span>
        </button>
      )}

      {currentProject && (
        <button
          className={`nav-btn ${view === 'spec' ? 'active' : ''}`}
          onClick={() => setView('spec')}
          id="nav-spec"
        >
          <Cpu size={18} />
          <span className="nav-tooltip">Spec Intel</span>
        </button>
      )}

      {currentProject && isAdmin && (
        <button
          className={`nav-btn ${view === 'settings' ? 'active' : ''}`}
          onClick={() => setView('settings')}
          id="nav-settings"
        >
          <Settings size={18} />
          <span className="nav-tooltip">Project Settings</span>
        </button>
      )}

      <button
        className={`nav-btn ${view === 'security' ? 'active' : ''}`}
        onClick={() => setView('security')}
        id="nav-security"
      >
        <Shield size={18} />
        <span className="nav-tooltip">Security</span>
      </button>

      <div className="nav-spacer" />

      <div className="user-section">
        <button className="user-switcher" title={userEmail}>
          <div className="user-avatar" style={{ background: 'var(--accent)', color: 'white' }}>
            {userInitial}
          </div>
          <span className="user-label">Account</span>
        </button>
        
        <button className="nav-btn logout-btn" onClick={handleLogout} title="Log Out">
          <LogOut size={18} />
        </button>
      </div>

      <style>{`
        .user-section {
          display: flex;
          flex-direction: column;
          gap: 12px;
          align-items: center;
          padding-bottom: 20px;
        }
        .logout-btn {
          color: var(--text-muted);
          transition: color 0.2s;
        }
        .logout-btn:hover {
          color: #ef4444;
          background: rgba(239, 68, 68, 0.1);
        }
      `}</style>
    </nav>
  )
}
