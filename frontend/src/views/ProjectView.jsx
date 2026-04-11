import React, { useState, useEffect, useMemo } from 'react'
import { ArrowLeft, Plus, ChevronRight, Layers, Trash2, AlertTriangle, List, Search, X, BookOpen, ExternalLink, FileDown, Printer } from 'lucide-react'
import ConfirmModal from '../components/ConfirmModal'
import { generateProjectReport } from '../services/reports'
import { StatusBadge, BicChip, PriorityChip } from '../components/StatusBadge'
import SubmittalDetailPanel from '../components/SubmittalDetailPanel'
import AddSubmittalModal from '../components/AddSubmittalModal'
import SubmittalChat from '../components/SubmittalChat'
import SubmittalRow from '../components/SubmittalRow'
import OmSubRow from '../components/OmSubRow'
import SortTh from '../components/SortHeader'
import { getSubmittals, deleteSubmittal } from '../services/submittal_service'
import { getOmAttachmentsForSubmittals } from '../services/attachment_service'
import { getAllActivityLogs } from '../services/activity_service'

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

export default function ProjectView({ project, onBack, activeUser, onSpecIntel, activeUserRole }) {
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

  // Universal Confirmation Modal State
  const [confirm, setConfirm] = useState({ 
    isOpen: false, 
    title: '', 
    message: '', 
    onConfirm: () => {}, 
    type: 'danger', 
    confirmLabel: 'Confirm'
  })

  const handleDownloadReport = () => {
    const doc = generateProjectReport(project, submittals)
    doc.save(`${project.number || 'PROJECT'}_SUBMITTAL_LOG_${new Date().toISOString().split('T')[0]}.pdf`)
  }

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
    setConfirm({
      isOpen: true,
      title: 'Delete Submittal?',
      message: 'This will permanently remove this item and all its revisions. This cannot be undone.',
      confirmLabel: 'Delete Submittal',
      onConfirm: async () => {
        await deleteSubmittal(id)
        if (selectedSubmittal?.id === id) setSelectedSubmittal(null)
        setSubmittals(ss => ss.filter(s => s.id !== id))
      }
    })
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

            <button 
              className="btn btn-ghost btn-sm" 
              onClick={handleDownloadReport}
              title="Download Professional PDF Log"
              id="btn-print-log"
            >
              <Printer size={12} /> Print Log
            </button>

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
                    <SortTh label="Expected Date"        field="expected"      sortField={sortField} sortDir={sortDir} onSort={handleSort} />
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
            activeUserRole={activeUserRole}
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
        isShifted={!!selectedSubmittal}
      />

      <ConfirmModal
        {...confirm}
        onCancel={() => setConfirm(c => ({ ...c, isOpen: false }))}
      />
    </>
  )
}
