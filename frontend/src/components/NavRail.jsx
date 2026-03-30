import { LayoutDashboard, FolderOpen, Settings } from 'lucide-react'

export default function NavRail({ view, setView, currentProject, goToDashboard }) {
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
          <span className="nav-tooltip">{currentProject.name}</span>
        </button>
      )}

      {currentProject && (
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
    </nav>
  )
}
