import React, { useState, useEffect } from 'react'
import NavRail from './components/NavRail'
import Dashboard from './views/Dashboard'
import ProjectView from './views/ProjectView'
import SpecView from './views/SpecView'
import Settings from './views/Settings'
import { getProjects } from './services/api'

export default function App() {
  const [view, setView] = useState('dashboard')
  const [projects, setProjects] = useState([])
  const [currentProject, setCurrentProject] = useState(null)
  const [loading, setLoading] = useState(true)
  const [showArchived, setShowArchived] = useState(false)
  const [activeUser, setActiveUser] = useState(() => {
    return localStorage.getItem('st_active_user') || 'PM'
  })

  useEffect(() => {
    localStorage.setItem('st_active_user', activeUser)
  }, [activeUser])

  const loadProjects = async () => {
    try {
      setLoading(true)
      const data = await getProjects(showArchived, activeUser)
      setProjects(data)
    } catch (err) {
      console.error('Failed to load projects:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadProjects()
  }, [showArchived])

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

  return (
    <div className="app-shell">
      <NavRail
        view={view}
        setView={setView}
        currentProject={currentProject}
        goToDashboard={goToDashboard}
        activeUser={activeUser}
        setActiveUser={setActiveUser}
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
            activeUser={activeUser}
          />
        )}
        {view === 'spec' && currentProject && (
          <SpecView
            project={currentProject}
            activeUser={activeUser}
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
