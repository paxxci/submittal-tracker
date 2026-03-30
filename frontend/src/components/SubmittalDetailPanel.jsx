import React, { useState, useEffect, useRef } from 'react'
import { X, Send, Upload, FileText, Trash2, ExternalLink, CheckCircle2 } from 'lucide-react'
import { StatusBadge, BicChip, STATUS_OPTIONS, BIC_OPTIONS } from './StatusBadge'
import {
  getActivityLog, addActivity,
  getAttachments, uploadAttachment, deleteAttachment,
  updateSubmittal, getContacts
} from '../services/api'

const fmt = (ts) => {
  if (!ts) return ''
  const d = new Date(ts)
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) +
    ' · ' + d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
}

const fmtDate = (d) => d ? new Date(d + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—'

export default function SubmittalDetailPanel({ submittal, projectId, onClose, onUpdated }) {
  const [form, setForm] = useState({
    spec_section: submittal?.spec_section || '',
    item_name: submittal?.item_name || '',
    status: submittal?.status || 'not_started',
    bic: submittal?.bic || 'you',
    priority: submittal?.priority || 'medium',
    next_action: submittal?.next_action || '',
    due_date: submittal?.due_date || '',
    submitted_date: submittal?.submitted_date || '',
  })
  const [log, setLog] = useState([])
  const [attachments, setAttachments] = useState([])
  const [contacts, setContacts] = useState([])
  const [note, setNote] = useState('')
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [savingNote, setSavingNote] = useState(false)
  const fileRef = useRef()
  const feedRef = useRef()

  useEffect(() => {
    if (!submittal) return
    setForm({
      spec_section: submittal.spec_section || '',
      item_name: submittal.item_name || '',
      status: submittal.status,
      bic: submittal.bic,
      priority: submittal.priority,
      next_action: submittal.next_action || '',
      due_date: submittal.due_date || '',
      submitted_date: submittal.submitted_date || '',
    })
    loadLog()
    loadAttachments()
    if (projectId) getContacts(projectId).then(setContacts).catch(() => {})
  }, [submittal?.id])

  const loadLog = async () => {
    try { setLog(await getActivityLog(submittal.id)) }
    catch {}
  }

  const loadAttachments = async () => {
    try { setAttachments(await getAttachments(submittal.id)) }
    catch {}
  }

  useEffect(() => {
    if (feedRef.current) feedRef.current.scrollTop = feedRef.current.scrollHeight
  }, [log])

  if (!submittal) return null

  const set = (field) => (e) => {
    const value = e.target.value
    setForm(f => {
      const next = { ...f, [field]: value }
      // Auto-fill submitted date when status flips to submitted
      if (field === 'status' && value === 'submitted' && !f.submitted_date) {
        next.submitted_date = new Date().toISOString().split('T')[0]
      }
      return next
    })
  }

  const handleSave = async () => {
    try {
      setSaving(true)
      const updated = await updateSubmittal(submittal.id, form)

      // Build a list of everything that changed
      const changes = []

      if (form.spec_section !== (submittal.spec_section || ''))
        changes.push(`Spec section updated to "${form.spec_section}"`)

      if (form.item_name !== (submittal.item_name || ''))
        changes.push(`Description updated to "${form.item_name}"`)

      if (form.status !== submittal.status) {
        const from = STATUS_OPTIONS.find(o => o.value === submittal.status)?.label || submittal.status
        const to   = STATUS_OPTIONS.find(o => o.value === form.status)?.label   || form.status
        changes.push(`Status: ${from} → ${to}`)
      }

      if (form.bic !== submittal.bic) {
        const from = BIC_OPTIONS.find(o => o.value === submittal.bic)?.label || submittal.bic
        const to   = BIC_OPTIONS.find(o => o.value === form.bic)?.label   || form.bic
        changes.push(`Ball in court: ${from} → ${to}`)
      }

      if (form.priority !== submittal.priority) {
        const cap = s => s.charAt(0).toUpperCase() + s.slice(1)
        changes.push(`Priority: ${cap(submittal.priority)} → ${cap(form.priority)}`)
      }

      if (form.due_date !== (submittal.due_date || '')) {
        const d = form.due_date
          ? new Date(form.due_date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
          : 'none'
        changes.push(`Due date set to ${d}`)
      }

      if (form.next_action !== (submittal.next_action || '') && form.next_action.trim())
        changes.push(`Next action: "${form.next_action.trim()}"`)

      // Log all changes as one entry so the feed stays clean
      if (changes.length > 0) {
        await addActivity(submittal.id, changes.join('\n'))
        setLog(await getActivityLog(submittal.id))
      }

      onUpdated(updated)
    } catch (err) {
      console.error('Save failed:', err)
    } finally {
      setSaving(false)
    }
  }

  const handleNote = async (e) => {
    e.preventDefault()
    if (!note.trim()) return
    try {
      setSavingNote(true)
      await addActivity(submittal.id, note.trim())
      setNote('')
      setLog(await getActivityLog(submittal.id))
    } catch {}
    finally { setSavingNote(false) }
  }

  const handleUpload = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    try {
      setUploading(true)
      await uploadAttachment(submittal.id, file)
      setAttachments(await getAttachments(submittal.id))
      await addActivity(submittal.id, `Attachment uploaded: "${file.name}"`)
      setLog(await getActivityLog(submittal.id))
    } catch (err) {
      console.error('Upload failed:', err)
    } finally {
      setUploading(false)
      e.target.value = ''
    }
  }

  const handleDeleteAttachment = async (att) => {
    if (!confirm(`Remove "${att.file_name}"?`)) return
    try {
      await deleteAttachment(att.id, att.file_url)
      setAttachments(a => a.filter(x => x.id !== att.id))
    } catch {}
  }

  const today = new Date().toISOString().split('T')[0]
  const isOverdue = form.due_date && form.due_date < today &&
    !['approved', 'rejected'].includes(form.status)

  return (
    <div className={`detail-panel open`} id="detail-panel">
      {/* Header */}
      <div className="detail-panel-header">
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
          <div className="detail-panel-title">{submittal.item_name}</div>
          <button className="btn btn-icon btn-sm" onClick={onClose}><X size={14} /></button>
        </div>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
          <StatusBadge status={submittal.status} />
          <BicChip bic={submittal.bic} />
          {submittal.round > 1 && (
            <span style={{ fontSize: 10, color: 'var(--s-revise)', background: 'rgba(249,115,22,0.1)', padding: '2px 7px', borderRadius: 4, fontWeight: 700 }}>
              R{submittal.round}
            </span>
          )}
          {isOverdue && (
            <span style={{ fontSize: 10, color: 'var(--s-rejected)', background: 'rgba(239,68,68,0.1)', padding: '2px 7px', borderRadius: 4, fontWeight: 700 }}>
              OVERDUE
            </span>
          )}
        </div>
      </div>

      <div className="detail-panel-body">
        {/* Fields */}
        <div className="detail-section">
          <div className="detail-section-title">Edit Details</div>

          {/* Spec Section + Description */}
          <div className="field-row-2">
            <div className="field-row">
              <label className="field-label">Spec Section #</label>
              <input className="field-input" placeholder="26 05 19" value={form.spec_section} onChange={set('spec_section')} id="detail-spec-section" />
            </div>
            <div className="field-row">
              <label className="field-label">Description</label>
              <input className="field-input" placeholder="Description" value={form.item_name} onChange={set('item_name')} id="detail-item-name" />
            </div>
          </div>

          <div className="field-row-2">
            <div className="field-row">
              <label className="field-label">Status</label>
              <select className="field-select" value={form.status} onChange={set('status')} id="detail-status">
                {STATUS_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>
            <div className="field-row">
              <label className="field-label">Ball In Court</label>
              <select className="field-select" value={form.bic} onChange={set('bic')} id="detail-bic">
                {BIC_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                {contacts.length > 0 && (
                  <>
                    <option disabled value="">── Contacts ──</option>
                    {contacts.map(c => (
                      <option key={c.id} value={c.name}>
                        {c.name}{c.company ? ` (${c.company})` : ''}
                      </option>
                    ))}
                  </>
                )}
              </select>
            </div>
          </div>

          <div className="field-row-2">
            <div className="field-row">
              <label className="field-label">Priority</label>
              <select className="field-select" value={form.priority} onChange={set('priority')} id="detail-priority">
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
            </div>
            <div className="field-row">
              <label className="field-label">Due Date</label>
              <input className="field-input" type="date" value={form.due_date} onChange={set('due_date')} id="detail-due-date" />
            </div>
          </div>

          <div className="field-row">
            <label className="field-label">Submitted Date</label>
            <input className="field-input" type="date" value={form.submitted_date} onChange={set('submitted_date')} id="detail-submitted-date" />
          </div>

          <div className="field-row">
            <label className="field-label">Next Action</label>
            <textarea className="field-textarea" rows={2}
              placeholder="What needs to happen next..."
              value={form.next_action}
              onChange={set('next_action')}
              id="detail-next-action"
            />
          </div>

          <button
            className="btn btn-primary btn-sm"
            onClick={handleSave}
            disabled={saving}
            style={{ width: '100%', justifyContent: 'center' }}
            id="btn-save-detail"
          >
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>

        {/* Activity Log */}
        <div className="detail-section" style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0, paddingBottom: 0 }}>
          <div className="detail-section-title">Activity Log</div>
          <div className="activity-feed" ref={feedRef} style={{ flex: 1, minHeight: 80, maxHeight: 220 }}>
            {log.length === 0 && (
              <div style={{ color: 'var(--text-muted)', fontSize: 11, textAlign: 'center', padding: '12px 0' }}>
                No activity yet. Add a note below.
              </div>
            )}
            {log.map(entry => (
              <div key={entry.id} className="activity-entry">
                <div className="activity-meta">
                  <span className="activity-author">{entry.author}</span>
                  <span className="activity-time">{fmt(entry.created_at)}</span>
                </div>
                <div className="activity-msg">{entry.message}</div>
              </div>
            ))}
          </div>
          <div className="activity-add">
            <textarea
              value={note}
              onChange={e => setNote(e.target.value)}
              placeholder="Add a note..."
              rows={1}
              id="input-activity-note"
              onKeyDown={e => {
                if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleNote(e) }
              }}
            />
            <button
              className="btn btn-primary btn-sm"
              onClick={handleNote}
              disabled={savingNote || !note.trim()}
              style={{ padding: '7px 10px', flexShrink: 0 }}
              id="btn-add-note"
            >
              <Send size={12} />
            </button>
          </div>
        </div>

        {/* Attachments */}
        <div className="detail-section">
          <div className="detail-section-title">Attachments</div>

          <div className="attachment-list" style={{ marginBottom: 8 }}>
            {attachments.map(att => (
              <div key={att.id} className="attachment-item">
                <FileText size={14} style={{ color: 'var(--accent)', flexShrink: 0 }} />
                <span className="attachment-name" title={att.file_name}>{att.file_name}</span>
                <a href={att.file_url} target="_blank" rel="noopener noreferrer"
                  className="btn btn-icon btn-sm" title="Open" style={{ border: 'none' }}>
                  <ExternalLink size={12} />
                </a>
                <button className="btn btn-icon btn-sm"
                  onClick={() => handleDeleteAttachment(att)}
                  title="Remove"
                  style={{ border: 'none', color: 'var(--s-rejected)' }}>
                  <Trash2 size={12} />
                </button>
              </div>
            ))}
          </div>

          <div
            className="upload-zone"
            onClick={() => fileRef.current?.click()}
            id="upload-zone"
          >
            <Upload size={14} style={{ margin: '0 auto 4px', display: 'block' }} />
            {uploading ? 'Uploading...' : 'Click to upload PDF or cutsheet'}
          </div>
          <input
            ref={fileRef}
            type="file"
            accept=".pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg"
            style={{ display: 'none' }}
            onChange={handleUpload}
            id="file-input"
          />
        </div>
      </div>
    </div>
  )
}
