import React, { useState, useEffect } from 'react'
import { Plus, Building2, CheckCircle2, Clock, AlertTriangle, FolderOpen } from 'lucide-react'
import NewProjectModal from '../components/NewProjectModal'
import { getProjectStats } from '../services/api'

function ProjectCard({ project, onOpen }) {
  const [stats, setStats] = useState(null)

  useEffect(() => {
    getProjectStats(project.id).then(setStats).catch(() => {})
  }, [project.id])

  const pct = stats && stats.total > 0
    ? Math.round((stats.approved / stats.total) * 100)
    : 0

  return (
    <div className="project-card card-glow" onClick={() => onOpen(project)} id={`project-card-${project.id}`}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 4 }}>
        <div style={{ flex: 1 }}>
          <div className="project-card-name">{project.name}</div>
          <div className="project-card-meta">
            {project.number && <span>#{project.number}</span>}
            {project.number && project.client && <span> · </span>}
            {project.client && <span>{project.client}</span>}
          </div>
        </div>
        <div style={{ position: 'relative' }}>
          <div style={{
            width: 36, height: 36, borderRadius: 10,
            background: project.is_archived ? 'var(--bg-overlay)' : 'var(--accent-dim)', 
            border: '1px solid var(--border-hover)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: project.is_archived ? 'var(--text-muted)' : 'var(--accent)', flexShrink: 0
          }}>
            {project.is_archived ? <Archive size={16} /> : <FolderOpen size={16} />}
          </div>
          {project.is_archived && (
            <div style={{
              position: 'absolute', top: -6, right: -6,
              background: 'var(--bg-overlay)', border: '1px solid var(--border)',
              borderRadius: 4, padding: '2px 6px', fontSize: 9, fontWeight: 700,
              color: 'var(--text-muted)', letterSpacing: 0.5, boxShadow: '0 2px 8px rgba(0,0,0,0.3)'
            }}>
              ARCHIVED
            </div>
          )}
        </div>
      </div>

      {/* Progress Bar */}
      <div className="progress-bar-wrap" style={{ 
        marginBottom: 14, 
        marginTop: 14 
      }}>
        <div className="progress-bar-fill" style={{ width: `${pct}%` }} />
      </div>

      {/* Stats */}
      {stats ? (
        <div className="project-card-stats">
          <div className="project-mini-stat">
            <span className="project-mini-stat-val" style={{ color: 'var(--text)' }}>{stats.total}</span>
            <span className="project-mini-stat-label">Total</span>
          </div>
          <div className="project-mini-stat">
            <span className="project-mini-stat-val" style={{ color: 'var(--s-approved)' }}>{stats.approved}</span>
            <span className="project-mini-stat-label">Approved</span>
          </div>
          <div className="project-mini-stat">
            <span className="project-mini-stat-val" style={{ color: 'var(--text-sub)' }}>{stats.pending + stats.submitted + stats.in_review}</span>
            <span className="project-mini-stat-label">Open</span>
          </div>
          {stats.overdue > 0 && (
            <div className="project-mini-stat">
              <span className="project-mini-stat-val" style={{ color: 'var(--s-rejected)' }}>{stats.overdue}</span>
              <span className="project-mini-stat-label">Overdue</span>
            </div>
          )}
          <div className="project-mini-stat" style={{ marginLeft: 'auto' }}>
            <span className="project-mini-stat-val" style={{ color: 'var(--accent)' }}>{pct}%</span>
            <span className="project-mini-stat-label">Complete</span>
          </div>
        </div>
      ) : (
        <div style={{ display: 'flex', gap: 8 }}>
          {[60, 40, 50].map((w, i) => (
            <div key={i} className="skeleton" style={{ height: 28, width: w, borderRadius: 4 }} />
          ))}
        </div>
      )}
    </div>
  )
}

export default function Dashboard({ 
  projects, 
  loading, 
  onOpenProject, 
  onProjectsChange, 
  showArchived, 
  setShowArchived 
}) {
  const [showNewProject, setShowNewProject] = useState(false)

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

        <button
          className="btn btn-primary"
          onClick={() => setShowNewProject(true)}
          id="btn-new-project"
        >
          <Plus size={14} />
          New Project
        </button>
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
            <button className="btn btn-primary" onClick={() => setShowNewProject(true)}>
              <Plus size={14} /> New Project
            </button>
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
