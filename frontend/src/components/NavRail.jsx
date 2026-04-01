import { LayoutDashboard, FolderOpen, Settings, Cpu, UserCircle } from 'lucide-react'

export default function NavRail({ view, setView, currentProject, goToDashboard, activeUser, setActiveUser }) {
  const roles = ['PM', 'GC', 'ARCH', 'ENG', 'VENDOR', 'SUPER']
  
  const cycleUser = () => {
    const currentIndex = roles.indexOf(activeUser)
    const nextIndex = (currentIndex + 1) % roles.length
    setActiveUser(roles[nextIndex])
  }

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

      <button className="user-switcher" onClick={cycleUser} title="Click to switch role">
        <div className={`user-avatar tag-${activeUser.toLowerCase()}`}>
          {activeUser[0]}
        </div>
        <span className="user-label">{activeUser}</span>
      </button>
    </nav>
  )
}
