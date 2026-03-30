import React, { useState, useEffect } from 'react'
import { ArrowLeft, Plus, ChevronRight, Layers, Trash2, AlertTriangle, List, Search, X } from 'lucide-react'
import { StatusBadge, BicChip, PriorityChip } from '../components/StatusBadge'
import SubmittalDetailPanel from '../components/SubmittalDetailPanel'
import AddSubmittalModal from '../components/AddSubmittalModal'
import { getSubmittals, deleteSubmittal } from '../services/api'

const ALL_STATUSES = [
  { value: 'not_started',     label: 'Not Started' },
  { value: 'working',         label: 'Working'      },
  { value: 'submitted',       label: 'Submitted'    },
  { value: 'in_review',       label: 'In Review'    },
  { value: 'approved',        label: 'Approved'     },
  { value: 'revise_resubmit', label: 'Revise & Resubmit' },
  { value: 'rejected',        label: 'Rejected'     },
]

export default function ProjectView({ project, onBack }) {
  const [submittals, setSubmittals] = useState([])
  const [selectedSubmittal, setSelectedSubmittal] = useState(null)
  const [showAddSubmittal, setShowAddSubmittal] = useState(false)
  const [loading, setLoading] = useState(true)
  const [filterStatus, setFilterStatus] = useState(null)
  const [search, setSearch] = useState('')

  useEffect(() => { load() }, [project.id])

  const load = async () => {
    try {
      setLoading(true)
      const subs = await getSubmittals(project.id)
      setSubmittals(subs)
    } catch (err) { console.error(err) }
    finally { setLoading(false) }
  }

  const handleDeleteSubmittal = async (id, e) => {
    e.stopPropagation()
    if (!confirm('Delete this submittal?')) return
    await deleteSubmittal(id)
    if (selectedSubmittal?.id === id) setSelectedSubmittal(null)
    setSubmittals(ss => ss.filter(s => s.id !== id))
  }

  const handleSubmittalUpdated = (updated) => {
    setSubmittals(ss => ss.map(s => s.id === updated.id ? updated : s))
    setSelectedSubmittal(updated)
  }

  const today = new Date().toISOString().split('T')[0]

  // Filter + search
  const filtered = submittals.filter(s => {
    const matchStatus = !filterStatus || s.status === filterStatus
    const q = search.toLowerCase()
    const matchSearch = !q ||
      (s.spec_section || '').toLowerCase().includes(q) ||
      (s.item_name || '').toLowerCase().includes(q) ||
      (s.next_action || '').toLowerCase().includes(q)
    return matchStatus && matchSearch
  })

  // Status counts for filter chips
  const counts = {}
  for (const s of submittals) counts[s.status] = (counts[s.status] || 0) + 1

  return (
    <>
      {/* Top Bar */}
      <div className="top-bar">
        <button className="btn btn-icon" onClick={onBack} title="Back to Dashboard" style={{ marginRight: 4 }}>
          <ArrowLeft size={16} />
        </button>
        <div className="breadcrumb">
          <span>Dashboard</span>
          <ChevronRight size={12} className="breadcrumb-sep" />
          <span className="breadcrumb-active">{project.name}</span>
          {project.number && <span style={{ color: 'var(--text-dim)', fontSize: 11 }}> · #{project.number}</span>}
        </div>
        <div style={{ flex: 1 }} />
        <button className="btn btn-primary btn-sm" onClick={() => setShowAddSubmittal(true)} id="btn-add-submittal">
          <Plus size={12} /> Add Submittal
        </button>
      </div>

      {/* Main Layout */}
      <div className="project-layout">
        <div className="submittal-main">

          {/* Toolbar — search + filter */}
          <div style={{
            padding: '10px 16px',
            borderBottom: '1px solid var(--border)',
            display: 'flex',
            gap: 10,
            alignItems: 'center',
            flexWrap: 'wrap',
            background: 'var(--bg-surface)',
            flexShrink: 0,
          }}>
            {/* Search */}
            <div className="search-wrap" style={{ minWidth: 200 }}>
              <Search size={12} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
              <input
                placeholder="Search submittals..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                id="search-submittals"
              />
              {search && (
                <button onClick={() => setSearch('')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', display: 'flex' }}>
                  <X size={11} />
                </button>
              )}
            </div>

            {/* Status filter chips */}
            <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
              <button
                className={`filter-chip ${!filterStatus ? 'active' : ''}`}
                onClick={() => setFilterStatus(null)}
                id="filter-all"
              >
                All <span className="filter-chip-count">{submittals.length}</span>
              </button>
              {ALL_STATUSES.filter(s => counts[s.value]).map(s => (
                <button
                  key={s.value}
                  className={`filter-chip filter-chip-${s.value} ${filterStatus === s.value ? 'active' : ''}`}
                  onClick={() => setFilterStatus(prev => prev === s.value ? null : s.value)}
                  id={`filter-${s.value}`}
                >
                  {s.label} <span className="filter-chip-count">{counts[s.value]}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Table */}
          <div className="table-wrap">
            {loading ? (
              <div style={{ padding: 32 }}>
                {[1, 2, 3, 4].map(i => (
                  <div key={i} className="skeleton" style={{ height: 44, marginBottom: 1, borderRadius: 0 }} />
                ))}
              </div>
            ) : filtered.length === 0 ? (
              <div className="empty-state">
                <div className="empty-state-icon">
                  <Layers size={24} style={{ color: 'var(--accent)' }} />
                </div>
                <div className="empty-state-title">
                  {submittals.length === 0 ? 'No submittals yet' : 'No results'}
                </div>
                <div className="empty-state-sub" style={{ marginBottom: 16 }}>
                  {submittals.length === 0
                    ? 'Add your first submittal to start tracking.'
                    : 'Try adjusting your search or filter.'}
                </div>
                {submittals.length === 0 && (
                  <button className="btn btn-primary btn-sm" onClick={() => setShowAddSubmittal(true)}>
                    <Plus size={12} /> Add Submittal
                  </button>
                )}
              </div>
            ) : (
              <table className="submittal-table" id="submittal-table">
                <thead>
                  <tr>
                    <th style={{ width: 28 }}>Pri</th>
                    <th style={{ width: 100 }}>Spec Section</th>
                    <th>Description</th>
                    <th>Status</th>
                    <th>Ball In Court</th>
                    <th>Due Date</th>
                    <th style={{ textAlign: 'center', width: 80 }}>Revision</th>
                    <th style={{ width: 48 }} />
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(sub => (
                    <SubmittalRow
                      key={sub.id}
                      sub={sub}
                      today={today}
                      selected={selectedSubmittal?.id === sub.id}
                      onClick={() => setSelectedSubmittal(sub)}
                      onDelete={handleDeleteSubmittal}
                    />
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {selectedSubmittal && (
          <SubmittalDetailPanel
            submittal={selectedSubmittal}
            projectId={project.id}
            onClose={() => setSelectedSubmittal(null)}
            onUpdated={handleSubmittalUpdated}
          />
        )}
      </div>

      {showAddSubmittal && (
        <AddSubmittalModal
          projectId={project.id}
          onClose={() => setShowAddSubmittal(false)}
          onCreated={() => { setShowAddSubmittal(false); load() }}
        />
      )}
    </>
  )
}

function SubmittalRow({ sub, today, selected, onClick, onDelete }) {
  const isOverdue = sub.due_date && sub.due_date < today && !['approved', 'rejected'].includes(sub.status)
  const isApproved = sub.status === 'approved'
  const rowClass = [selected ? 'selected' : '', isApproved ? 'row-approved' : ''].filter(Boolean).join(' ')
  return (
    <tr className={rowClass} onClick={onClick} id={`row-${sub.id}`}>
      <td style={{ width: 28, textAlign: 'center', padding: '0 4px' }}>
        <PriorityChip priority={sub.priority} />
      </td>
      <td style={{ width: 100 }}>
        <span style={{
          fontSize: 11, fontWeight: 700,
          color: isApproved ? 'var(--s-approved)' : 'var(--accent)',
          letterSpacing: '0.3px'
        }}>
          {sub.spec_section || '—'}
        </span>
      </td>
      <td className="td-name">
        <div>{sub.item_name}</div>
        {sub.next_action && (
          <div className="td-name-sub" style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <ChevronRight size={9} />
            {sub.next_action}
          </div>
        )}
      </td>
      <td><StatusBadge status={sub.status} /></td>
      <td><BicChip bic={sub.bic} /></td>
      <td className={`td-date ${isOverdue ? 'overdue' : ''}`}>
        {isOverdue && <AlertTriangle size={10} style={{ marginRight: 4, display: 'inline' }} />}
        {sub.due_date
          ? new Date(sub.due_date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
          : '—'}
      </td>
      <td style={{ textAlign: 'center' }}>
        {sub.round > 1
          ? <span style={{ color: 'var(--s-revise)', fontWeight: 700, fontSize: 11 }}>Rev {sub.round}</span>
          : <span style={{ color: 'var(--text-dim)', fontSize: 11 }}>—</span>}
      </td>
      <td>
        <div className="row-actions">
          <button
            className="btn btn-icon btn-sm"
            style={{ color: 'var(--s-rejected)', border: 'none' }}
            onClick={e => onDelete(sub.id, e)}
            title="Delete"
          >
            <Trash2 size={12} />
          </button>
        </div>
      </td>
    </tr>
  )
}
