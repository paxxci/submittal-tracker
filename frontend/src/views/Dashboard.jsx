import React, { useState, useEffect } from 'react'
import { Plus, Building2, CheckCircle2, Clock, AlertTriangle, FolderOpen, Search, LayoutGrid, List, ArrowDownAZ, SortDesc, Hash } from 'lucide-react'
import NewProjectModal from '../components/NewProjectModal'
import ProjectCard from '../components/ProjectCard'

export default function Dashboard({ 
  projects, 
  loading, 
  onOpenProject, 
  onProjectsChange, 
  showArchived, 
  setShowArchived,
  userEmail,
  organization,
  isGlobalAdmin
}) {
  const [showNewProject, setShowNewProject] = useState(false)
  const [search, setSearch] = useState('')
  const [sortBy, setSortBy] = useState('newest') // newest, alpha, number
  const [viewMode, setViewMode] = useState('grid') // grid, list
  
  // "Island Access" check: 
  const isIslandOwner = !loading && (isGlobalAdmin || projects.some(p => p.project_members?.some(m => m.email === userEmail && m.role === 'admin')))

  // Filter & Sort Logic
  const filtered = projects
    .filter(p => showArchived || !p.is_archived)
    .filter(p => 
      p.name?.toLowerCase().includes(search.toLowerCase()) || 
      p.number?.toLowerCase().includes(search.toLowerCase())
    )
    .sort((a, b) => {
      if (sortBy === 'alpha') return (a.name || '').localeCompare(b.name || '')
      if (sortBy === 'number') return (a.number || '').localeCompare(b.number || '')
      return new Date(b.created_at) - new Date(a.created_at)
    })

  return (
    <>
      {/* Top Bar */}
      <div className="top-bar">
        <span className="top-bar-title">Project Portfolio</span>
        <div style={{ flex: 1 }} />
        
        <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
          {/* Archive Toggle */}
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 12, color: 'var(--text-muted)' }}>
            <input 
              type="checkbox" 
              checked={showArchived} 
              onChange={e => setShowArchived(e.target.checked)}
              style={{ accentColor: 'var(--accent)' }}
            />
            Show Archived
          </label>

          {isIslandOwner && (
            <button
              className="btn btn-primary"
              onClick={() => setShowNewProject(true)}
              id="btn-new-project"
            >
              <Plus size={14} /> New Project
            </button>
          )}
        </div>
      </div>

      {/* Body */}
      <div className="stage-body" style={{ padding: '40px' }}>
        
        {/* Header & Controls */}
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 40, borderBottom: '1px solid var(--border)', paddingBottom: 32 }}>
          <div>
            <h1 style={{ fontSize: 32, fontWeight: 900, letterSpacing: '-1px', marginBottom: 4 }}>
              System Registry
            </h1>
            <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>
              Managing <strong style={{ color: 'var(--accent)' }}>{filtered.length}</strong> active workspaces.
            </p>
          </div>

          <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            {/* Search */}
            <div className="search-wrap" style={{ width: 280, background: 'var(--bg-surface-elevated)' }}>
              <Search size={14} color="var(--text-muted)" />
              <input 
                placeholder="Find project name or #..." 
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>

            {/* Sort Toggle */}
            <div style={{ display: 'flex', background: 'var(--bg-elevated)', padding: 4, borderRadius: 10, border: '1px solid var(--border)' }}>
               <button 
                onClick={() => setSortBy('newest')}
                className={`btn btn-sm ${sortBy === 'newest' ? 'btn-primary' : 'btn-ghost'}`}
                style={{ borderRadius: 8, padding: '6px 12px' }}
                title="Sort by Date"
               >
                 <SortDesc size={14} />
               </button>
               <button 
                onClick={() => setSortBy('alpha')}
                className={`btn btn-sm ${sortBy === 'alpha' ? 'btn-primary' : 'btn-ghost'}`}
                style={{ borderRadius: 8, padding: '6px 12px' }}
                title="Sort A-Z"
               >
                 <ArrowDownAZ size={14} />
               </button>
               <button 
                onClick={() => setSortBy('number')}
                className={`btn btn-sm ${sortBy === 'number' ? 'btn-primary' : 'btn-ghost'}`}
                style={{ borderRadius: 8, padding: '6px 12px' }}
                title="Sort Project #"
               >
                 <Hash size={14} />
               </button>
            </div>

            {/* View Toggle */}
            <div style={{ display: 'flex', background: 'var(--bg-elevated)', padding: 4, borderRadius: 10, border: '1px solid var(--border)', marginLeft: 8 }}>
               <button 
                onClick={() => setViewMode('grid')}
                className={`btn btn-sm ${viewMode === 'grid' ? 'btn-primary' : 'btn-ghost'}`}
                style={{ borderRadius: 8, padding: '6px 12px' }}
               >
                 <LayoutGrid size={14} />
               </button>
               <button 
                onClick={() => setViewMode('list')}
                className={`btn btn-sm ${viewMode === 'list' ? 'btn-primary' : 'btn-ghost'}`}
                style={{ borderRadius: 8, padding: '6px 12px' }}
               >
                 <List size={14} />
               </button>
            </div>
          </div>
        </div>

        {/* Projects Render */}
        {loading ? (
          <div className="projects-grid">
            {[1, 2, 3].map(i => (
              <div key={i} className="card ai-shimmer" style={{ height: 160 }} />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="empty-state animate-in" style={{ padding: '100px 40px', borderStyle: 'dashed' }}>
            <Building2 size={40} color="var(--text-muted)" style={{ marginBottom: 20 }} />
            <div style={{ fontSize: 18, fontWeight: 700 }}>No matching workspaces found</div>
            <p style={{ color: 'var(--text-muted)', fontSize: 13, marginTop: 8 }}>Try adjusting your search or creative a new project.</p>
          </div>
        ) : viewMode === 'grid' ? (
          <div className="projects-grid animate-in">
            {filtered.map(p => (
              <ProjectCard key={p.id} project={p} onOpen={onOpenProject} />
            ))}
          </div>
        ) : (
          <div className="card animate-in" style={{ overflow: 'hidden' }}>
            <table className="submittal-table">
              <thead>
                <tr>
                  <th>Identity & Reference</th>
                  <th>Portfolio Status</th>
                  <th>Client / Entity</th>
                  <th style={{ textAlign: 'right' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                 {filtered.map(p => (
                  <tr key={p.id} onClick={() => onOpenProject(p)} style={{ cursor: 'pointer', height: 72, background: p.is_archived ? 'rgba(239, 68, 68, 0.02)' : 'transparent' }}>
                    <td>
                       <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                          <div style={{ 
                            width: 40, height: 40, 
                            background: p.is_archived ? 'rgba(239, 68, 68, 0.1)' : 'var(--bg-elevated)', 
                            border: p.is_archived ? '1px solid rgba(239, 68, 68, 0.2)' : '1px solid var(--border)', 
                            borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' 
                          }}>
                             {p.is_archived ? <Archive size={18} color="var(--s-rejected)" /> : <FolderOpen size={18} color="var(--accent)" />}
                          </div>
                          <div>
                            <div style={{ fontWeight: 800, fontSize: 15, color: p.is_archived ? 'var(--s-rejected)' : 'var(--text-main)' }}>{p.name}</div>
                            <div style={{ fontSize: 11, color: 'var(--text-muted)', letterSpacing: 1 }}>{p.number || 'NO PROJECT #'}</div>
                          </div>
                       </div>
                    </td>
                    <td>
                       {p.is_archived ? (
                         <span className="badge" style={{ background: 'var(--s-rejected)', color: '#fff', border: 'none' }}>Archived Vault</span>
                       ) : (
                         <span className="badge badge-pending">Active Registry</span>
                       )}
                    </td>
                    <td style={{ fontSize: 13, color: 'var(--text-muted)' }}>
                      {p.client || 'Internal Portfolio'}
                    </td>
                    <td style={{ textAlign: 'right' }}>
                       <button className="btn btn-ghost btn-sm">Enter Workbench <Clock size={12} /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

       {showNewProject && (
        <NewProjectModal
          onClose={() => setShowNewProject(false)}
          onCreated={() => { setShowNewProject(false); onProjectsChange() }}
          organizationId={organization?.id}
        />
      )}
    </>
  )
}
