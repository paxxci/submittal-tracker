import React, { useState, useEffect } from 'react'
import NavRail from './components/NavRail'
import Dashboard from './views/Dashboard'
import ProjectView from './views/ProjectView'
import SpecView from './views/SpecView'
import Settings from './views/Settings'
import AccountSecurity from './views/AccountSecurity'
import Login from './views/Login'
import { getProjects } from './services/project_service'
import { supabase } from './supabase_client'

export default function App() {
  const [session, setSession] = useState(null)
  const [view, setView] = useState('dashboard')
  const [projects, setProjects] = useState([])
  const [currentProject, setCurrentProject] = useState(null)
  const [loading, setLoading] = useState(true)
  const [showArchived, setShowArchived] = useState(false)
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false)
  const [recoveryFlow, setRecoveryFlow] = useState(false)

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
    })

    // Listen for changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setSession(session)
      if (event === 'PASSWORD_RECOVERY') {
        setRecoveryFlow(true)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  const loadProjects = async () => {
    if (!session) return
    try {
      setLoading(true)
      const data = await getProjects(showArchived)
      setProjects(data)
    } catch (err) {
      console.error('Failed to load projects:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (session) loadProjects()
  }, [showArchived, session])

  const openProject = (project) => {
    setCurrentProject(project)
    setView('project')
  }

  const goToDashboard = () => {
    setCurrentProject(null)
    setView('dashboard')
  }

  const activeUserRole = currentProject?.project_members?.[0]?.role || 'viewer'

  const handleProjectUpdated = (updated) => {
    setCurrentProject(prev => prev ? { ...prev, ...updated } : updated)
    setProjects(ps => ps.map(p => p.id === updated.id ? { ...p, ...updated } : p))
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    setShowLogoutConfirm(false)
  }

  if (!session || recoveryFlow) {
    return <Login onComplete={() => setRecoveryFlow(false)} initialMode={recoveryFlow ? 'reset' : 'login'} />
  }

  return (
    <div className="app-shell">
      <NavRail
        view={view}
        setView={setView}
        currentProject={currentProject}
        goToDashboard={goToDashboard}
        userEmail={session.user.email}
        onLogoutRequest={() => setShowLogoutConfirm(true)}
      />
      <div className="main-stage">
        {view === 'dashboard' && (
          <Dashboard
            projects={projects}
            loading={loading}
            onOpenProject={openProject}
            onProjectsChange={loadProjects}
            showArchived={showArchived}
            setShowArchived={setShowArchived}
            userEmail={session?.user?.email}
          />
        )}
        {view === 'project' && currentProject && (
          <ProjectView 
            project={currentProject} 
            onBack={goToDashboard} 
            activeUser={session?.user} 
            onSpecIntel={() => setView('spec')}
            activeUserRole={activeUserRole}
          />
        )}
        {view === 'spec' && currentProject && (
          <SpecView
            project={currentProject}
            activeUser={session.user.email}
            onBack={() => setView('project')}
            activeUserRole={activeUserRole}
          />
        )}
        {view === 'settings' && currentProject && (
          <Settings 
            project={currentProject} 
            onProjectUpdated={handleProjectUpdated}
            activeUserRole={activeUserRole}
          />
        )}
        {view === 'security' && (
          <AccountSecurity />
        )}
      </div>

      {/* Global Logout Modal */}
      {showLogoutConfirm && (
        <div className="modal-backdrop animate-in" style={{ zIndex: 9999 }}>
          <div className="modal" style={{ maxWidth: 360, textAlign: 'center', padding: '32px 24px' }}>
            <div style={{ 
              width: 56, height: 56, borderRadius: '50%', 
              background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 20px'
            }}>
              <div style={{ fontSize: 24 }}>🚪</div>
            </div>
            <h2 style={{ fontSize: 20, fontWeight: 800, marginBottom: 8 }}>Log Out?</h2>
            <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 20, lineHeight: 1.5 }}>
              Are you sure you want to log out of the Submittal Tracker? Your session will be ended.
            </p>
            <div style={{ display: 'flex', gap: 12 }}>
              <button 
                className="btn btn-outline" 
                style={{ flex: 1 }}
                onClick={() => setShowLogoutConfirm(false)}
              >
                Cancel
              </button>
              <button 
                className="btn" 
                style={{ flex: 1, background: '#ef4444', color: 'white' }}
                onClick={handleLogout}
              >
                Log Out
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
