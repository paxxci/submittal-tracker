import React, { useState, useEffect } from 'react'
import { FolderOpen, Archive } from 'lucide-react'
import { getProjectStats, calculateCompletionPercentage } from '../logic/stats_engine'

export default function ProjectCard({ project, onOpen }) {
  const [stats, setStats] = useState(null)

  useEffect(() => {
    getProjectStats(project.id).then(setStats).catch(() => {})
  }, [project.id])

  const pct = stats ? calculateCompletionPercentage(stats.approved, stats.total) : 0

  return (
    <div className="project-card card-glow" onClick={() => onOpen(project)} id={`project-card-${project.id}`}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 4 }}>
        <div style={{ flex: 1 }}>
          <div className="project-card-name">{project.name}</div>
          <div className="project-card-meta">
            {project.number && <span>#{project.number}</span>}
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
            <span className="project-mini-stat-val" style={{ color: 'var(--text-sub)' }}>{stats.total - stats.approved - stats.rejected}</span>
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
