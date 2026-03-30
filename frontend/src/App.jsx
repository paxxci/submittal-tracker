import React, { useState, useEffect } from 'react'
import NavRail from './components/NavRail'
import Dashboard from './views/Dashboard'
import ProjectView from './views/ProjectView'
import Settings from './views/Settings'
import { getProjects } from './services/api'

export default function App() {
  const [view, setView] = useState('dashboard')
  const [projects, setProjects] = useState([])
  const [currentProject, setCurrentProject] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadProjects()
  }, [])

  const loadProjects = async () => {
    try {
      setLoading(true)
      const data = await getProjects()
      setProjects(data)
    } catch (err) {
      console.error('Failed to load projects:', err)
    } finally {
      setLoading(false)
    }
  }

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
      />
      <div className="main-stage">
        {view === 'dashboard' && (
          <Dashboard
            projects={projects}
            loading={loading}
            onOpenProject={openProject}
            onProjectsChange={loadProjects}
          />
        )}
        {view === 'project' && currentProject && (
          <ProjectView
            project={currentProject}
            onBack={goToDashboard}
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
