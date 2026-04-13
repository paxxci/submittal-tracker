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
  
  // "Island Access" check: 
  // 1. If you are brand new (no projects), you are starting your first island.
  // 2. If you are an 'admin' in any project, you have management rights.
  // 3. If you were only invited as an 'editor' or 'viewer', you cannot create projects.
  const isIslandOwner = !loading && (
    projects.length === 0 || 
    projects.some(p => p.project_members?.[0]?.role === 'admin')
  )

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

        {isIslandOwner && (
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
          <div className="empty-state animate-in" style={{ 
            marginTop: 40,
            background: 'rgba(255,255,255,0.02)',
            border: '1px dashed var(--border)',
            borderRadius: 'var(--radius-lg)',
            padding: '80px 40px'
          }}>
            <div className="empty-state-icon" style={{ 
              background: 'linear-gradient(135deg, var(--accent), #22d3ee)',
              boxShadow: '0 0 30px rgba(0, 180, 216, 0.3)',
              color: '#000'
            }}>
              <Building2 size={28} />
            </div>
            <div className="empty-state-title" style={{ fontSize: 20, color: 'var(--text)' }}>Welcome to Submittal Tracker</div>
            <div className="empty-state-sub" style={{ marginBottom: 32, fontSize: 13, color: 'var(--text-sub)' }}>
              You haven't been added to any projects yet. Start by creating your own first project to begin tracking submittals with your team.
            </div>
            {isIslandOwner && (
              <button className="btn btn-primary btn-lg" onClick={() => setShowNewProject(true)} style={{ padding: '12px 24px', fontSize: 14 }}>
                <Plus size={18} /> Create Your First Project
              </button>
            )}
          </div>
        ) : (
          <div className="projects-grid animate-in">
            {projects
              .filter(p => showArchived || !p.is_archived)
              .map(p => (
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
