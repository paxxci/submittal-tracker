import React from 'react'
import { LayoutDashboard, FolderOpen, Settings, Cpu, LogOut, Users } from 'lucide-react'
import { supabase } from '../supabase_client'

export default function NavRail({ view, setView, currentProject, goToDashboard, userEmail, onLogoutRequest, activeUserRole, userProfile, isGlobalAdmin }) {
  const handleLogout = async () => {
    onLogoutRequest()
  }

  const userInitial = userEmail?.[0].toUpperCase() || '?'
  const isAdminInCurrent = activeUserRole === 'admin'

  return (
    <nav className="nav-rail">
      <div className="nav-logo">ST</div>

      {/* ── PRODUCTION ZONE (Top) ── */}
      <button
        className={`nav-btn ${view === 'dashboard' ? 'active' : ''}`}
        onClick={goToDashboard}
        id="nav-dashboard"
      >
        <LayoutDashboard size={18} />
        <span className="nav-tooltip">Dashboard</span>
      </button>

      {currentProject && (
        <div style={{ height: 1, width: 30, background: 'var(--border)', margin: '8px 0', opacity: 0.5 }} />
      )}

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

      {currentProject && isAdminInCurrent && (
        <button
          className={`nav-btn ${view === 'settings' ? 'active' : ''}`}
          onClick={() => setView('settings')}
          id="nav-settings"
        >
          <Settings size={18} />
          <span className="nav-tooltip">Project Settings</span>
        </button>
      )}

      <div className="nav-spacer" />

      {/* ── COMMAND CENTER (Bottom) ── */}
      <div className="command-center">
        {isGlobalAdmin && (
          <button
            className={`nav-btn ${view === 'team' ? 'active' : ''}`}
            onClick={() => setView('team')}
            id="nav-team-management"
          >
            <Users size={18} />
            <span className="nav-tooltip">Team Management</span>
          </button>
        )}

        <button 
          className={`nav-btn user-switcher ${view === 'security' ? 'active' : ''}`} 
          onClick={() => setView('security')}
          id="nav-account"
        >
          <div className="user-avatar" style={{ 
            background: 'linear-gradient(135deg, var(--accent), #22d3ee)', 
            color: '#000',
            fontWeight: 800,
            boxShadow: view === 'security' ? '0 0 15px var(--accent)' : '0 4px 12px rgba(0, 180, 216, 0.3)'
          }}>
            {userInitial}
          </div>
          <span className="nav-tooltip">Account</span>
        </button>
        
        <button className="nav-btn logout-btn" onClick={handleLogout} id="nav-logout">
          <LogOut size={16} />
          <span className="nav-tooltip">Log Out</span>
        </button>
      </div>

      <style>{`
        .command-center {
          display: flex;
          flex-direction: column;
          gap: 8px;
          align-items: center;
          padding-bottom: 12px;
          width: 100%;
        }
        
        .user-switcher {
          height: auto !important;
          padding: 4px 0 !important;
        }

        .user-switcher:hover .user-avatar {
          transform: scale(1.1);
          filter: brightness(1.2);
        }

        .logout-btn {
          color: var(--text-muted);
          opacity: 0.5;
        }
        
        .logout-btn:hover {
          opacity: 1;
          color: #ef4444;
          background: rgba(239, 68, 68, 0.1) !important;
        }
        
        .command-center .nav-tooltip {
          left: 54px;
          white-space: nowrap;
        }
      `}</style>
    </nav>
  )
}
