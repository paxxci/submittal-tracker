import React, { useState, useEffect, useMemo } from 'react'
import { ArrowLeft, Plus, ChevronRight, Layers, Trash2, AlertTriangle, List, Search, X, BookOpen, ExternalLink, FileDown, Printer } from 'lucide-react'
import { StatusBadge, BicChip, PriorityChip } from '../components/StatusBadge'
import SubmittalDetailPanel from '../components/SubmittalDetailPanel'
import AddSubmittalModal from '../components/AddSubmittalModal'
import SubmittalChat from '../components/SubmittalChat'
import { Sparkles } from 'lucide-react'
import { getSubmittals, deleteSubmittal, getOmAttachmentsForSubmittals, getAllActivityLogs } from '../services/api'

const ALL_STATUSES = [
  { value: 'not_started',     label: 'Not Started' },
  { value: 'working',         label: 'Working'      },
  { value: 'submitted',       label: 'Submitted'    },
  { value: 'in_review',       label: 'In Review'    },
  { value: 'approved',        label: 'Approved'     },
  { value: 'revise_resubmit', label: 'Revise & Resubmit' },
  { value: 'rejected',        label: 'Rejected'     },
]

const PRIORITY_LABELS = { high: 'High', medium: 'Medium', low: 'Low' }
const STATUS_LABELS = {
  not_started: 'Not Started', working: 'Working', submitted: 'Submitted',
  in_review: 'In Review', approved: 'Approved', revise_resubmit: 'Revise & Resubmit', rejected: 'Rejected',
}

// Export logic is moving inside the component for direct URL management

export default function ProjectView({ project, onBack, activeUser, onSpecIntel }) {
  const [submittals, setSubmittals] = useState([])
  const [omMap, setOmMap] = useState({}) // submittal_id → [attachments]
  const [activityLogs, setActivityLogs] = useState([])
  const [selectedSubmittal, setSelectedSubmittal] = useState(null)
  const [showAddSubmittal, setShowAddSubmittal] = useState(false)
  const [loading, setLoading] = useState(true)
  const [filterStatus, setFilterStatus] = useState(null)
  const [search, setSearch] = useState('')
  const [sortField, setSortField] = useState(null)
  const [sortDir, setSortDir] = useState('asc')
  const [csvUrl, setCsvUrl] = useState('')

  const handleSort = (field) => {
    if (sortField === field) setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    else { setSortField(field); setSortDir('asc') }
  }

  useEffect(() => { load() }, [project.id])

  const load = async () => {
    try {
      setLoading(true)
      const subs = await getSubmittals(project.id)
      setSubmittals(subs)
      // Load O&M attachments for all submittals in one query
      if (subs.length) {
        const oms = await getOmAttachmentsForSubmittals(subs.map(s => s.id))
        const grouped = {}
        for (const om of oms) {
          if (!grouped[om.submittal_id]) grouped[om.submittal_id] = []
          grouped[om.submittal_id].push(om)
        }
        setOmMap(grouped)

        // Load all activity logs for the AI to parse
        const logs = await getAllActivityLogs(subs.map(s => s.id))
        setActivityLogs(logs)
      }
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

  // Filter + search + sort
  const PRIORITY_ORDER = { high: 0, medium: 1, low: 2 }
  const STATUS_ORDER = { not_started: 0, working: 1, submitted: 2, in_review: 3, approved: 4, revise_resubmit: 5, rejected: 6 }

  const filtered = useMemo(() => {
    return submittals
      .filter(s => {
        const matchStatus = !filterStatus || s.status === filterStatus
        const q = search.toLowerCase()
        const matchSearch = !q ||
          (s.spec_sections?.csi_code || '').toLowerCase().includes(q) ||
          (s.item_name || '').toLowerCase().includes(q) ||
          (s.next_action || '').toLowerCase().includes(q)
        return matchStatus && matchSearch
      })
      .sort((a, b) => {
        if (!sortField) return 0
        let av, bv
        if (sortField === 'priority')     { av = PRIORITY_ORDER[a.priority] ?? 1; bv = PRIORITY_ORDER[b.priority] ?? 1 }
        else if (sortField === 'spec')    { av = a.spec_sections?.csi_code || ''; bv = b.spec_sections?.csi_code || '' }
        else if (sortField === 'name')    { av = a.item_name || '';    bv = b.item_name || '' }
        else if (sortField === 'status')  { av = STATUS_ORDER[a.status] ?? 9; bv = STATUS_ORDER[b.status] ?? 9 }
        else if (sortField === 'due')       { av = a.due_date || 'zzz'; bv = b.due_date || 'zzz' }
        else if (sortField === 'submitted') { av = a.submitted_date || 'zzz'; bv = b.submitted_date || 'zzz' }
        const cmp = typeof av === 'number' ? av - bv : av.localeCompare(bv)
        return sortDir === 'asc' ? cmp : -cmp
      })
  }, [submittals, filterStatus, search, sortField, sortDir])

  // Native CSV Export — On-demand to prevent render loops
  const handleExport = () => {
    if (!filtered.length) return
    const headers = ['Spec Section', 'Description', 'Status', 'Ball In Court', 'Priority', 'Due Date', 'Submitted Date', 'Revision', 'Next Action']
    const fmtDate = d => d ? new Date(d + 'T00:00:00').toLocaleDateString('en-US') : ''
    const rows = filtered.map(s => [
      s.spec_sections?.csi_code || '',
      s.item_name || '',
      STATUS_LABELS[s.status] || s.status,
      s.bic || '',
      PRIORITY_LABELS[s.priority] || s.priority,
      fmtDate(s.due_date),
      fmtDate(s.submitted_date),
      s.round > 1 ? `Rev ${s.round}` : '1',
      s.next_action || '',
    ])
    const csvContent = [headers, ...rows]
      .map(r => r.map(v => `"${String(v ?? '').replace(/"/g, '""')}"`).join(','))
      .join('\n')
    
    const blob = new Blob(["\ufeff", csvContent], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.download = `${(project?.name || 'Submittals').replace(/\s+/g, '_')}_Log.csv`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

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
        <button
          className="btn btn-ghost btn-sm"
          onClick={() => window.print()}
          title="Print Visual Report (PDF)"
          style={{ marginRight: 6 }}
        >
          <Printer size={12} /> Print Report
        </button>
        <button
          className="btn btn-ghost btn-sm"
          onClick={handleExport}
          title="Export CSV"
          id="btn-export-csv"
          style={{ marginRight: 6, display: 'inline-flex', alignItems: 'center', gap: 4 }}
        >
          <FileDown size={12} /> Export CSV
        </button>
        <button className="btn btn-primary btn-sm" onClick={() => setShowAddSubmittal(true)} id="btn-add-submittal" style={{ marginRight: 6 }}>
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
                    <SortTh label="Pri"            field="priority" sortField={sortField} sortDir={sortDir} onSort={handleSort} style={{ width: 28 }} />
                    <SortTh label="Spec Section"   field="spec"     sortField={sortField} sortDir={sortDir} onSort={handleSort} style={{ width: 100 }} />
                    <SortTh label="Description"    field="name"     sortField={sortField} sortDir={sortDir} onSort={handleSort} />
                    <SortTh label="Status"          field="status"   sortField={sortField} sortDir={sortDir} onSort={handleSort} />
                    <th>Ball In Court</th>
                    <SortTh label="Due Date"        field="due"      sortField={sortField} sortDir={sortDir} onSort={handleSort} />
                    <SortTh label="Submitted"       field="submitted" sortField={sortField} sortDir={sortDir} onSort={handleSort} />
                    <th style={{ textAlign: 'center', width: 80 }}>Revision</th>
                    <th style={{ width: 48 }} />
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(sub => (
                    <React.Fragment key={sub.id}>
                      <SubmittalRow
                        sub={sub}
                        today={today}
                        selected={selectedSubmittal?.id === sub.id}
                        onClick={() => setSelectedSubmittal(sub)}
                        onDelete={handleDeleteSubmittal}
                      />
                      {(omMap[sub.id] || []).map(om => (
                        <OmSubRow key={om.id} om={om} />
                      ))}
                    </React.Fragment>
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
            activeUser={activeUser}
            onClose={() => setSelectedSubmittal(null)}
            onUpdated={handleSubmittalUpdated}
          />
        )}
      </div>

      {showAddSubmittal && (
        <AddSubmittalModal
          projectId={project.id}
          activeUser={activeUser}
          onClose={() => setShowAddSubmittal(false)}
          onCreated={() => { setShowAddSubmittal(false); load() }}
        />
      )}

      <SubmittalChat
        submittals={submittals}
        activityLogs={activityLogs}
        projectName={project.name}
      />
    </>
  )
}

function SortTh({ label, field, sortField, sortDir, onSort, style }) {
  const active = sortField === field
  return (
    <th
      onClick={() => onSort(field)}
      style={{
        cursor: 'pointer', userSelect: 'none',
        color: active ? 'var(--accent)' : undefined,
        ...style,
      }}
    >
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3 }}>
        {label}
        <span style={{ fontSize: 9, opacity: active ? 1 : 0.3 }}>
          {active ? (sortDir === 'asc' ? '↑' : '↓') : '↕'}
        </span>
      </span>
    </th>
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
          {sub.spec_sections?.csi_code || '—'}
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
      <td className="td-date">
        {sub.submitted_date
          ? new Date(sub.submitted_date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
          : <span style={{ color: 'var(--text-dim)' }}>—</span>}
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

function OmSubRow({ om }) {
  const fmt = (ts) => ts
    ? new Date(ts).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    : ''
  return (
    <tr className="om-sub-row" id={`om-row-${om.id}`}>
      <td style={{ width: 28, padding: 0 }} />
      <td style={{ width: 100, paddingLeft: 20, paddingRight: 4, color: 'var(--text-muted)', fontSize: 12 }}>└─</td>
      <td colSpan={4} style={{ paddingLeft: 4 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <BookOpen size={11} style={{ color: 'var(--s-approved)', flexShrink: 0 }} />
          <span style={{ fontSize: 11, color: 'var(--text-sub)' }}>{om.file_name}</span>
          <span style={{
            fontSize: 9, fontWeight: 700, letterSpacing: '0.5px',
            color: 'var(--s-approved)', background: 'rgba(16,185,129,0.1)',
            padding: '1px 5px', borderRadius: 3,
          }}>O&amp;M</span>
          {fmt(om.uploaded_at) && (
            <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>· {fmt(om.uploaded_at)}</span>
          )}
        </div>
      </td>
      <td style={{ textAlign: 'center' }} />
      <td>
        <a href={om.file_url} target="_blank" rel="noopener noreferrer"
          className="btn btn-icon btn-sm" title="Open file" style={{ border: 'none' }}
          onClick={e => e.stopPropagation()}>
          <ExternalLink size={11} style={{ color: 'var(--s-approved)' }} />
        </a>
      </td>
    </tr>
  )
}
