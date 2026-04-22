import React, { useState, useEffect, useRef } from 'react'

export default function ProjectSearchableDropdown({ projects, selected, onChange, role }) {
  const [query, setQuery] = useState('')
  const [isOpen, setIsOpen] = useState(false)
  const containerRef = useRef(null)
  
  // Close when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const projectsFiltered = (projects || []).filter(p => 
    p && (
      p.name?.toLowerCase().includes(query.toLowerCase()) || 
      p.number?.toLowerCase().includes(query.toLowerCase())
    )
  ).slice(0, 11) 

  const toggleItem = (id) => {
    if (selected.includes(id)) onChange(selected.filter(i => i !== id))
    else onChange([...selected, id])
  }

  return (
    <div style={{ position: 'relative' }} ref={containerRef}>
      {/* Search Input / Trigger */}
      <div 
        className="card" 
        style={{ 
          padding: '8px 12px', background: 'var(--bg-elevated)', border: isOpen ? '1px solid var(--accent)' : '1px solid var(--border)', 
          borderRadius: 8, display: 'flex', flexWrap: 'wrap', gap: 6, cursor: 'text',
          minHeight: 44, boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.1)',
          transition: 'border-color 0.2s'
        }}
        onClick={() => setIsOpen(!isOpen)}
      >
        {selected.length === 0 && !query && (
          <div style={{ position: 'absolute', left: 14, top: 12, fontSize: 13, color: 'var(--text-muted)', pointerEvents: 'none' }}>
            {projects.length === 0 ? "No projects found in portfolio..." : "Search & select projects..."}
          </div>
        )}
        
        {selected.map(id => {
          const p = projects.find(proj => proj.id === id)
          if (!p) return null
          return (
            <div key={id} style={{ 
              background: 'var(--accent)', color: '#000', borderRadius: 4, 
              padding: '4px 10px', fontSize: 11, fontWeight: 800, display: 'flex', alignItems: 'center', gap: 6,
              boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
            }}>
              {p.name || 'Untitled Project'}
              <span onClick={(e) => { e.stopPropagation(); toggleItem(id) }} style={{ cursor: 'pointer', opacity: 0.6, fontSize: 14 }}>✕</span>
            </div>
          )
        })}
        <input 
          style={{ 
            background: 'transparent', border: 'none', color: 'var(--text)', 
            flex: 1, minWidth: 120, outline: 'none', fontSize: 13, padding: '4px 0'
          }}
          value={query}
          onChange={e => { setQuery(e.target.value); setIsOpen(true) }}
          onFocus={() => setIsOpen(true)}
        />
      </div>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="card-glow animate-in" style={{ 
          position: 'relative', 
          marginTop: 12,
          background: 'var(--bg-surface-elevated)', 
          border: '1px solid var(--border)', 
          borderRadius: 12, 
          zIndex: 11, 
          maxHeight: 240, 
          overflowY: 'auto',
          padding: 8, 
          boxShadow: 'var(--shadow-xl)'
        }}>
            {projects.length === 0 ? (
              <div style={{ padding: 24, fontSize: 12, color: 'var(--text-muted)', textAlign: 'center' }}>
                Your portfolio icon appears empty. Ensure projects are created on the Dashboard first.
              </div>
            ) : projectsFiltered.length === 0 ? (
              <div style={{ padding: 24, fontSize: 12, color: 'var(--text-muted)', textAlign: 'center' }}>
                No projects match "{query}"
              </div>
            ) : projectsFiltered.map(p => {
              const active = selected.includes(p.id)
              return (
                <div 
                  key={p.id}
                  onClick={() => toggleItem(p.id)}
                  style={{ 
                    padding: '12px', borderRadius: 8, fontSize: 13, cursor: 'pointer',
                    background: active ? 'var(--accent-dim)' : 'transparent',
                    display: 'flex', alignItems: 'center', gap: 12,
                    marginBottom: 4, transition: 'background 0.2s'
                  }}
                  className="dropdown-item"
                >
                  <div style={{ 
                    width: 18, height: 18, borderRadius: 6, border: '2px solid',
                    borderColor: active ? 'var(--accent)' : 'var(--border)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    background: active ? 'var(--accent)' : 'transparent'
                  }}>
                    {active && <span style={{ color: '#000', fontSize: 11, fontWeight: 900 }}>✓</span>}
                  </div>
                   <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700, color: active ? 'var(--accent)' : 'var(--text)' }}>{p.name || 'Untitled Project'}</div>
                    <div style={{ fontSize: 10, color: 'var(--text-muted)', letterSpacing: '0.5px' }}>{p.number || 'NO #'} — <span style={{ color: 'var(--accent)', opacity: 0.8 }}>Assign as {role}</span></div>
                  </div>
                </div>
              )
            })}
          </div>
      )}
    </div>
  )
}
