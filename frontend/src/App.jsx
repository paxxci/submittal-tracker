import React, { useState, useEffect } from 'react'
import NavRail from './components/NavRail'
import Dashboard from './views/Dashboard'
import ProjectView from './views/ProjectView'
import SpecView from './views/SpecView'
import Settings from './views/Settings'
import Login from './views/Login'
import { getProjects } from './services/api'
import { supabase } from './supabase_client'

export default function App() {
  const [session, setSession] = useState(null)
  const [view, setView] = useState('dashboard')
  const [projects, setProjects] = useState([])
  const [currentProject, setCurrentProject] = useState(null)
  const [loading, setLoading] = useState(true)
  const [showArchived, setShowArchived] = useState(false)

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
    })

    // Listen for changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
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

  const handleProjectUpdated = (updated) => {
    setCurrentProject(updated)
    setProjects(ps => ps.map(p => p.id === updated.id ? updated : p))
  }

  if (!session) {
    return <Login />
  }

  return (
    <div className="app-shell">
      <NavRail
        view={view}
        setView={setView}
        currentProject={currentProject}
        goToDashboard={goToDashboard}
        userEmail={session.user.email}
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
          />
        )}
        {view === 'project' && currentProject && (
          <ProjectView
            project={currentProject}
            onBack={goToDashboard}
            activeUser={session.user.email}
          />
        )}
        {view === 'spec' && currentProject && (
          <SpecView
            project={currentProject}
            activeUser={session.user.email}
            onBack={() => setView('project')}
          />
        )}
        {view === 'settings' && (
          <Settings
            project={currentProject}
            onProjectUpdated={handleProjectUpdated}
          />
        )}
      </div>
    </div>
  )
}
