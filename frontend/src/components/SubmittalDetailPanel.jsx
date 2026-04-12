import React, { useState, useEffect, useRef } from 'react'
import { X, Send, Upload, FileText, Trash2, ExternalLink, BookOpen } from 'lucide-react'
import { StatusBadge, BicChip, STATUS_OPTIONS, BIC_OPTIONS } from './StatusBadge'
import ConfirmModal from './ConfirmModal'
import { getActivityLog, addActivity } from '../services/activity_service'
import { getAttachments, uploadAttachment, deleteAttachment } from '../services/attachment_service'
import { updateSubmittal } from '../services/submittal_service'
import { getContacts } from '../services/contact_service'
import { formatDate, calculateExpectedDate, isSubmittalOverdue } from '../logic/date_engine'
import { extractSubmittalMetadata } from '../services/ai'
import * as pdfjsLib from 'pdfjs-dist'

const fmt = (ts) => {
  if (!ts) return ''
  return formatDate(ts, { month: 'short', day: 'numeric' }) +
    ' · ' + new Date(ts).toLocaleDateString('en-US', { hour: 'numeric', minute: '2-digit' })
}

const AVATAR_COLORS = [
  'hsl(340, 75%, 55%)', // Vibrant Rose
  'hsl(210, 80%, 55%)', // Vivid Blue
  'hsl(160, 75%, 40%)', // Emerald
  'hsl(280, 70%, 60%)', // Deep Purple
  'hsl(25, 85%, 50%)',  // Amber/Orange
  'hsl(190, 80%, 45%)', // Cyan
  'hsl(0, 75%, 60%)',   // Red
  'hsl(240, 70%, 65%)', // Indigo
]

const getAvatarColor = (name) => {
  if (!name) return 'hsl(0, 0%, 50%)'
  const cleanName = name.trim()
  if (cleanName === 'AI Assistant') return 'var(--s-revise)'
  if (cleanName.startsWith('System')) return 'var(--text-muted)'
  let hash = 0
  for (let i = 0; i < cleanName.length; i++) {
    hash = cleanName.charCodeAt(i) + ((hash << 5) - hash)
  }
  // Add length to hash to further scatter similar strings, then modulo array length
  const index = Math.abs(hash + cleanName.length * 13) % AVATAR_COLORS.length
  return AVATAR_COLORS[index]
}

const getInitials = (name) => {
  if (!name) return '?'
  const cleanName = name.trim()
  if (cleanName === 'AI Assistant') return '🤖'
  if (cleanName.startsWith('System')) return '⚙️'
  return cleanName.split(' ').filter(w => w).map(w => w[0]).join('').slice(0, 2).toUpperCase()
}

export default function SubmittalDetailPanel({ submittal, projectId, activeUser, activeUserRole, onClose, onUpdated }) {
  const [form, setForm] = useState({
    spec_section_id: submittal?.spec_section_id || '',
    spec_section_code: submittal?.spec_sections?.csi_code || '',
    item_name: submittal?.item_name || '',
    status: submittal?.status || 'not_started',
    bic: submittal?.bic || 'you',
    priority: submittal?.priority || 'medium',
    next_action: submittal?.next_action || '',
    due_date: submittal?.due_date || '',
    submitted_date: submittal?.submitted_date || '',
    review_duration: submittal?.review_duration || 15,
  })
  const [log, setLog] = useState([])
  const [attachments, setAttachments] = useState([])
  const [omAttachments, setOmAttachments] = useState([])
  const [contacts, setContacts] = useState([])
  const [note, setNote] = useState('')
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [uploadingOM, setUploadingOM] = useState(false)
  const [savingNote, setSavingNote] = useState(false)
  const [isAiParsing, setIsAiParsing] = useState(false)
  const [aiFields, setAiFields] = useState(new Set())
  const fileRef = useRef()
  const omFileRef = useRef()
  const feedRef = useRef()

  // Universal Confirmation Modal State
  const [confirm, setConfirm] = useState({ 
    isOpen: false, 
    title: '', 
    message: '', 
    onConfirm: () => {}, 
    type: 'danger', 
    confirmLabel: 'Confirm'
  })

  useEffect(() => {
    if (!submittal) return
    setForm({
      spec_section_id: submittal.spec_section_id,
      spec_section_code: submittal.spec_sections?.csi_code || '',
      item_name: submittal.item_name || '',
      status: submittal.status,
      bic: submittal.bic,
      priority: submittal.priority,
      next_action: submittal.next_action || '',
      due_date: submittal.due_date || '',
      submitted_date: submittal.submitted_date || '',
      review_duration: submittal.review_duration || 15,
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
    try {
      const [subs, oms] = await Promise.all([
        getAttachments(submittal.id, 'submittal'),
        getAttachments(submittal.id, 'om'),
      ])
      setAttachments(subs)
      setOmAttachments(oms)
    } catch {}
  }

  useEffect(() => {
    if (feedRef.current) feedRef.current.scrollTop = feedRef.current.scrollHeight
  }, [log])

  if (!submittal) return null

  const set = (field) => (e) => {
    const value = e.target.value
    setForm(f => {
      const next = { ...f, [field]: value }
      if (field === 'status' && value === 'submitted' && !f.submitted_date) {
        const d = new Date()
        next.submitted_date = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
      }
      return next
    })
  }

  const handleSave = async () => {
    try {
      setSaving(true)
      
      // Clean data for DB (only send valid columns)
      const { spec_section_code, review_duration, ...cleanForm } = form
      if (review_duration) cleanForm.expected_days = review_duration
      
      const updated = await updateSubmittal(submittal.id, cleanForm, activeUserRole || 'PM')
      setLog(await getActivityLog(submittal.id))
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
      const userDisplay = activeUser.user_metadata?.full_name || activeUser.email || 'User'
      await addActivity(submittal.id, note.trim(), userDisplay)
      setNote('')
      setLog(await getActivityLog(submittal.id))
    } catch (err) {
      console.error('Failed to add note:', err)
    }
    finally { setSavingNote(false) }
  }

  const handleUpload = async (e, type = 'submittal') => {
    const file = e.target.files?.[0]
    if (!file) return
    const isOM = type === 'om'
    try {
      isOM ? setUploadingOM(true) : setUploading(true)
      
      // --- SUBMITTAL INTEL: AI Parsing ---
      if (!isOM && file.type === 'application/pdf') {
        try {
          setIsAiParsing(true)
          const arrayBuffer = await file.arrayBuffer()
          const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise
          let text = ''
          const maxPages = Math.min(pdf.numPages, 5)
          for (let i = 1; i <= maxPages; i++) {
            const page = await pdf.getPage(i)
            const content = await page.getTextContent()
            text += content.items.map(it => it.str).join(' ') + '\n'
          }
          
          const meta = await extractSubmittalMetadata(text)
          if (meta) {
            const newFields = new Set()
            setForm(f => {
              const next = { ...f }
              if (meta.spec_section && !f.spec_section_code) { next.spec_section_code = meta.spec_section; newFields.add('spec_section') }
              if (meta.item_name && !f.item_name) { next.item_name = meta.item_name; newFields.add('item_name') }
              if (meta.model) { 
                next.next_action = `Model: ${meta.model}${meta.manufacturer ? ` by ${meta.manufacturer}` : ''}`
                newFields.add('next_action')
              }
              return next
            })
            setAiFields(newFields)
            const userDisplay = activeUser.user_metadata?.full_name || activeUser.email || 'User'
            await addActivity(submittal.id, `🤖 AI Intel: Analyzed "${file.name}" and extracted metadata.`, 'AI Assistant')
          }
        } catch (aiErr) {
          console.error('AI Intel failed:', aiErr)
        } finally {
          setIsAiParsing(false)
        }
      }
      
      await uploadAttachment(submittal.id, file, type)
      await loadAttachments()
      const userDisplay = activeUser.user_metadata?.full_name || activeUser.email || 'User'
      await addActivity(submittal.id, `${isOM ? 'O&M document' : 'Attachment'} uploaded: "${file.name}"`, userDisplay)
      setLog(await getActivityLog(submittal.id))
    } catch (err) {
      console.error('Upload failed:', err)
    } finally {
      isOM ? setUploadingOM(false) : setUploading(false)
      e.target.value = ''
    }
  }

  const handleOfficialSubmission = async () => {
    const d = new Date()
    const localToday = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
    const next = { ...form, status: 'submitted', submitted_date: localToday }
    
    // Suggest BIC
    const suggestedBic = contacts.find(c =>
      c.type?.toLowerCase().includes('arch') ||
      c.name?.toLowerCase().includes('arch') ||
      c.name?.toLowerCase().includes('eng')
    )?.name
    if (suggestedBic) next.bic = suggestedBic

    try {
      setSaving(true)
      
      // Clean data for DB
      const { spec_section_code, review_duration, ...cleanForm } = next
      if (review_duration) cleanForm.expected_days = review_duration

      const updated = await updateSubmittal(submittal.id, cleanForm, activeUserRole || 'PM')
      setForm(next)
      const userDisplay = activeUser.user_metadata?.full_name || activeUser.email || 'User'
      await addActivity(submittal.id, `📤 OFFICIAL SUBMISSION FILED`, userDisplay)
      setLog(await getActivityLog(submittal.id))
      onUpdated(updated)
    } catch (err) {
      console.error('Submission failed:', err)
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteAttachment = async (att) => {
    setConfirm({
      isOpen: true,
      title: 'Remove Attachment?',
      message: `Permanently delete "${att.file_name}"? This action cannot be undone.`,
      confirmLabel: 'Remove File',
      onConfirm: async () => {
        try {
          await deleteAttachment(att.id, att.file_url)
          setAttachments(a => a.filter(x => x.id !== att.id))
          setOmAttachments(a => a.filter(x => x.id !== att.id))
          setConfirm(c => ({ ...c, isOpen: false }))
        } catch (err) {
          console.error('Delete failed:', err)
        }
      }
    })
  }

  const expectedDateStr = calculateExpectedDate(form.submitted_date, form.review_duration)
  const isOverdue = isSubmittalOverdue(expectedDateStr, form.status)

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
              <input className={`field-input ${isAiParsing ? 'ai-shimmer' : ''} ${aiFields.has('spec_section') ? 'ai-populated' : ''}`} 
                placeholder="26 05 19" value={form.spec_section_code} onChange={set('spec_section_code')} id="detail-spec-section" />
            </div>
            <div className="field-row">
              <label className="field-label">Description</label>
              <input className={`field-input ${isAiParsing ? 'ai-shimmer' : ''} ${aiFields.has('item_name') ? 'ai-populated' : ''}`} 
                placeholder="Description" value={form.item_name} onChange={set('item_name')} id="detail-item-name" />
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
                      <option key={c.id} value={`${c.name}${c.company ? ` (${c.company})` : ''}`}>
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
              <label className="field-label">Review Duration</label>
              <div style={{ position: 'relative' }}>
                <input 
                  className="field-input" 
                  type="number" 
                  min="1" 
                  max="90" 
                  value={form.review_duration || 15} 
                  onChange={set('review_duration')} 
                  style={{ paddingRight: 45 }}
                />
                <span style={{ 
                  position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', 
                  fontSize: 9, fontWeight: 700, color: 'var(--text-muted)', 
                  pointerEvents: 'none', letterSpacing: '0.5px' 
                }}>DAYS</span>
              </div>
            </div>
          </div>

          <div className="field-row-2">
            <div className="field-row">
              <label className="field-label">Submitted</label>
              <input className="field-input" type="date" value={form.submitted_date} onChange={set('submitted_date')} id="detail-submitted-date" />
            </div>
            <div className="field-row">
              <label className="field-label">Expected</label>
              <input className="field-input" type="date" disabled value={expectedDateStr || ''} />
            </div>
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
        <div className="detail-section">
          <div className="detail-section-title">Activity Log</div>
          <div className="activity-feed" ref={feedRef}>
            {log.length === 0 && (
              <div style={{ color: 'var(--text-muted)', fontSize: 11, textAlign: 'center', padding: '12px 0' }}>
                No activity yet. Add a note below.
              </div>
            )}
            {log.map(entry => {
              // Robust Self-Healing for legacy data (Converts JSON dumps into clean text)
              const clean = (val) => {
                if (typeof val !== 'string' || !val.trim().startsWith('{')) return val
                try {
                  const p = JSON.parse(val)
                  if (p.email) return p.user_metadata?.full_name || p.email
                  if (p.user_metadata) return p.user_metadata.full_name || 'User'
                  if (p.id) return `System Action [${p.id.slice(0,8)}]`
                  return '[Archive Data]'
                } catch { return val }
              }

              const displayAuthor = clean(entry.author || 'System Auto')
              const displayMsg = clean(entry.message)
              const bgColor = getAvatarColor(displayAuthor)
              const initials = getInitials(displayAuthor)

              return (
                <div key={entry.id} className="activity-entry">
                  <div className="activity-meta">
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <div style={{
                        width: 22, height: 22, borderRadius: '50%',
                        background: bgColor, color: '#fff',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 9, fontWeight: 800, flexShrink: 0,
                        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                      }}>
                        {initials}
                      </div>
                      <span className="activity-author-name" style={{ fontWeight: 700, color: 'var(--text-main)', fontSize: 13, letterSpacing: '-0.2px' }}>{displayAuthor}</span>
                    </div>
                    <span className="activity-time">{fmt(entry.created_at)}</span>
                  </div>
                  <div className="activity-msg">{displayMsg}</div>
                </div>
              )
            })}
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

        {/* Submittal Documents */}
        <AttachmentSection
          title="Submittal Documents"
          files={attachments}
          uploading={uploading}
          fileRef={fileRef}
          onUpload={e => handleUpload(e, 'submittal')}
          onDelete={handleDeleteAttachment}
          accentColor="var(--accent)"
          hint="Cut sheets, drawings, stamps"
          action={attachments.length > 0 && !['submitted', 'in_review', 'approved'].includes(form.status) && (
            <button
              className="btn btn-primary btn-sm"
              onClick={handleOfficialSubmission}
              style={{ padding: '4px 12px', fontSize: 10, background: 'var(--s-submit)', color: '#000' }}
              title="Flip to Submitted & set Date"
            >
              <Send size={11} /> Official Submission
            </button>
          )}
        />

        {/* O&M Documents */}
        <AttachmentSection
          title="O&M Documents"
          files={omAttachments}
          uploading={uploadingOM}
          fileRef={omFileRef}
          onUpload={e => handleUpload(e, 'om')}
          onDelete={handleDeleteAttachment}
          accentColor="var(--s-approved)"
          hint="Operations & maintenance manuals — uploaded at project closeout"
          icon={<BookOpen size={12} />}
        />
      </div>

      <ConfirmModal
        {...confirm}
        onCancel={() => setConfirm(c => ({ ...c, isOpen: false }))}
      />
    </div>
  )
}

function AttachmentSection({ title, files, uploading, fileRef, onUpload, onDelete, accentColor, hint, icon, action }) {
  return (
    <div className="detail-section">
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
        {icon && <span style={{ color: accentColor }}>{icon}</span>}
        <div className="detail-section-title" style={{ marginBottom: 0, color: accentColor }}>{title}</div>
        {hint && <span style={{ fontSize: 10, color: 'var(--text-muted)', marginLeft: 2 }}>— {hint}</span>}
        <div style={{ flex: 1 }} />
        {action}
      </div>

      {files.length > 0 && (
        <div className="attachment-list" style={{ marginBottom: 8 }}>
          {files.map(att => (
            <div key={att.id} className="attachment-item">
              <FileText size={14} style={{ color: accentColor, flexShrink: 0 }} />
              <span className="attachment-name" title={att.file_name}>{att.file_name}</span>
              <a href={att.file_url} target="_blank" rel="noopener noreferrer"
                className="btn btn-icon btn-sm" title="Open" style={{ border: 'none' }}>
                <ExternalLink size={12} />
              </a>
              <button className="btn btn-icon btn-sm"
                onClick={() => onDelete(att)}
                title="Remove"
                style={{ border: 'none', color: 'var(--s-rejected)' }}>
                <Trash2 size={12} />
              </button>
            </div>
          ))}
        </div>
      )}

      <div
        className="upload-zone"
        style={{ borderColor: `${accentColor}40` }}
        onClick={() => fileRef.current?.click()}
      >
        <Upload size={14} style={{ margin: '0 auto 4px', display: 'block', color: accentColor }} />
        {uploading ? 'Uploading...' : `Upload to ${title}`}
      </div>
      <input
        ref={fileRef}
        type="file"
        accept=".pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg"
        style={{ display: 'none' }}
        onChange={onUpload}
      />
    </div>
  )
}
