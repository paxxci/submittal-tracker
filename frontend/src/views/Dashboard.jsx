import React, { useState, useEffect } from 'react'
import { Plus, Building2, CheckCircle2, Clock, AlertTriangle, FolderOpen } from 'lucide-react'
import NewProjectModal from '../components/NewProjectModal'
import ProjectCard from '../components/ProjectCard'

export default function Dashboard({ 
  projects, 
  loading, 
  onOpenProject, 
  onProjectsChange, 
  showArchived, 
  setShowArchived,
  userEmail
}) {
  const [showNewProject, setShowNewProject] = useState(false)
  const isAdmin = ['paxtonmike11@gmail.com'].includes(userEmail)

  return (
    <>
      {/* Top Bar */}
      <div className="top-bar">
        <span className="top-bar-title">Dashboard</span>
        <div style={{ flex: 1 }} />
        
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginRight: 16 }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 12, color: 'var(--text-muted)' }}>
            <input 
              type="checkbox" 
              checked={showArchived} 
              onChange={e => setShowArchived(e.target.checked)}
              style={{ accentColor: 'var(--accent)' }}
            />
            Show Archived
          </label>
        </div>

        {isAdmin && (
          <button
            className="btn btn-primary"
            onClick={() => setShowNewProject(true)}
            id="btn-new-project"
          >
            <Plus size={14} />
            New Project
          </button>
        )}
      </div>

      {/* Body */}
      <div className="stage-body">
        {/* Header */}
        <div style={{ marginBottom: 28 }}>
          <h1 style={{ fontSize: 26, fontWeight: 900, letterSpacing: '-0.5px', marginBottom: 4 }}>
            Submittal Tracker
          </h1>
          <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>
            Know where every submittal stands, who has it, and what's next.
          </p>
        </div>

        {/* Projects */}
        {loading ? (
          <div className="projects-grid">
            {[1, 2, 3].map(i => (
              <div key={i} className="card" style={{ padding: 20 }}>
                <div className="skeleton" style={{ height: 16, width: '60%', marginBottom: 8, borderRadius: 4 }} />
                <div className="skeleton" style={{ height: 3, width: '100%', marginBottom: 16, borderRadius: 2 }} />
                <div style={{ display: 'flex', gap: 12 }}>
                  {[40, 50, 45].map((w, j) => (
                    <div key={j} className="skeleton" style={{ height: 32, width: w, borderRadius: 4 }} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : projects.length === 0 ? (
          <div className="empty-state animate-in">
            <div className="empty-state-icon">
              <Building2 size={24} style={{ color: 'var(--accent)' }} />
            </div>
            <div className="empty-state-title">No projects yet</div>
            <div className="empty-state-sub" style={{ marginBottom: 20 }}>
              Create your first project to start tracking submittals.
            </div>
            {isAdmin && (
              <button className="btn btn-primary" onClick={() => setShowNewProject(true)}>
                <Plus size={14} /> New Project
              </button>
            )}
          </div>
        ) : (
          <div className="projects-grid animate-in">
            {projects.map(p => (
              <ProjectCard key={p.id} project={p} onOpen={onOpenProject} />
            ))}
          </div>
        )}
      </div>

      {showNewProject && (
        <NewProjectModal
          onClose={() => setShowNewProject(false)}
          onCreated={() => { setShowNewProject(false); onProjectsChange() }}
        />
      )}
    </>
  )
}
