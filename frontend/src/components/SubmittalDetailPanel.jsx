import React, { useState, useEffect, useRef } from 'react'
import { X, Send, Upload, FileText, Trash2, ExternalLink, BookOpen, Star, Paperclip, Printer } from 'lucide-react'
import { StatusBadge, BicChip, STATUS_OPTIONS, BIC_OPTIONS } from './StatusBadge'
import ConfirmModal from './ConfirmModal'
import { getActivityLog, addActivity } from '../services/activity_service'
import { getAttachments, uploadAttachment, deleteAttachment, toggleAttachmentApproval, updateAttachmentRound } from '../services/attachment_service'
import { updateSubmittal } from '../services/submittal_service'
import { getContacts } from '../services/contact_service'
import { formatDate, calculateExpectedDate, isSubmittalOverdue } from '../logic/date_engine'
import { generateActivityLogReport } from '../services/reports'
import { extractSubmittalMetadata } from '../services/ai'
import * as pdfjsLib from 'pdfjs-dist'

const fmt = (ts) => {
  if (!ts) return ''
  const d = new Date(ts)
  if (isNaN(d.valueOf())) return 'Unknown Date'
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) +
    ' · ' + d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
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
    round: submittal?.round || 1
  })
  const [log, setLog] = useState([])
  const [attachments, setAttachments] = useState([])
  const [refAttachments, setRefAttachments] = useState([])
  const [omAttachments, setOmAttachments] = useState([])
  const [contacts, setContacts] = useState([])
  const [note, setNote] = useState('')
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [uploadingRef, setUploadingRef] = useState(false)
  const [uploadingOM, setUploadingOM] = useState(false)
  const [savingNote, setSavingNote] = useState(false)
  const [isAiParsing, setIsAiParsing] = useState(false)
  const [aiFields, setAiFields] = useState(new Set())
  const [activeTab, setActiveTab] = useState('details') // 'details', 'documents', 'activity'
  const fileRef = useRef()
  const refFileRef = useRef()
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
      round: submittal.round || 1
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
      const [subs, refs, oms] = await Promise.all([
        getAttachments(submittal.id, 'submittal'),
        getAttachments(submittal.id, 'reference'),
        getAttachments(submittal.id, 'om'),
      ])
      setAttachments(subs)
      setRefAttachments(refs)
      setOmAttachments(oms)
    } catch {}
  }

  useEffect(() => {
    if (activeTab === 'activity') {
      setTimeout(() => {
        if (feedRef.current) feedRef.current.scrollTop = feedRef.current.scrollHeight
      }, 50)
    }
  }, [log, activeTab])

  if (!submittal) return null

  const set = (field) => (e) => {
    const value = e.target.value
    setForm(f => {
      const next = { ...f, [field]: value }
      if (field === 'status' && value === 'submitted' && !f.submitted_date) {
        const d = new Date(new Date().toLocaleString("en-US", {timeZone: "America/Los_Angeles"}));
        next.submitted_date = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
      }
      return next
    })
  }

  const handleSave = async () => {
    try {
      setSaving(true)
      
      const oldNext = submittal.next_action || ''
      const newNext = form.next_action || ''
      if (oldNext.trim() !== newNext.trim()) {
        const userDisplay = activeUser.user_metadata?.full_name || activeUser.email || 'User'
        const actLabel = newNext.trim() ? `🎯 Set Next Action: "${newNext.trim()}"` : `🎯 Cleared Next Action`
        await addActivity(submittal.id, actLabel, userDisplay)
      }
      
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
    const isRef = type === 'reference'
    try {
      if (isOM) setUploadingOM(true)
      else if (isRef) setUploadingRef(true)
      else setUploading(true)
      
      // --- SUBMITTAL INTEL: AI Parsing ---
      if (type === 'submittal' && file.type === 'application/pdf') {
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
          }
        } catch (aiErr) {
          console.error('AI Intel failed:', aiErr)
        } finally {
          setIsAiParsing(false)
        }
      }
      
      const targetRound = type === 'submittal' ? (submittal.round || 1) : 1
      await uploadAttachment(submittal.id, file, type, targetRound)
      await loadAttachments()
      const userDisplay = activeUser.user_metadata?.full_name || activeUser.email || 'User'
      
      let logPrefix = 'Attachment'
      if (type === 'submittal') logPrefix = `[R${targetRound}] Submittal Document`
      if (isOM) logPrefix = 'O&M Document'
      if (isRef) logPrefix = 'Reference File'
      
      await addActivity(submittal.id, `${logPrefix} uploaded: "${file.name}"`, userDisplay)
      setLog(await getActivityLog(submittal.id))
    } catch (err) {
      console.error('Upload failed:', err)
    } finally {
      if (isOM) setUploadingOM(false)
      else if (isRef) setUploadingRef(false)
      else setUploading(false)
      e.target.value = ''
    }
  }

  const handleApproveAttachment = async (att, setApproved) => {
    try {
      setSaving(true)
      await toggleAttachmentApproval(submittal.id, att.id, setApproved)
      await loadAttachments()
      const userDisplay = activeUser.user_metadata?.full_name || activeUser.email || 'User'
      
      let updatedStatus = form.status
      if (setApproved) {
        await addActivity(submittal.id, `✅ Stamped [R${att.round || 1}] "${att.file_name}" as Officially Approved Version`, userDisplay)
        updatedStatus = 'approved'
      } else {
        await addActivity(submittal.id, `⏪ Revoked Approval Stamp from [R${att.round || 1}] "${att.file_name}"`, userDisplay)
        // Auto-revert status to pending or working if we just revoked the only approval
        if (form.status === 'approved') updatedStatus = 'working'
      }

      const updated = await updateSubmittal(submittal.id, { status: updatedStatus }, activeUserRole || 'PM')
      setForm(f => ({ ...f, status: updatedStatus }))
      setLog(await getActivityLog(submittal.id))
      onUpdated(updated)
    } catch (err) {
      console.error('Approve failed:', err)
    } finally {
      setSaving(false)
    }
  }

  const handleUpdateAttRound = async (att, newRound) => {
    try {
      await updateAttachmentRound(att.id, newRound)
      
      const freshSubs = await getAttachments(submittal.id, 'submittal')
      
      const userDisplay = activeUser.user_metadata?.full_name || activeUser.email || 'User'
      await addActivity(submittal.id, `🔄 Re-classified "${att.file_name}" to Revision ${newRound}`, userDisplay)
      
      const maxRound = freshSubs.length > 0 ? Math.max(...freshSubs.map(a => a.round || 1)) : newRound
      
      if (maxRound !== (form.round || 1)) {
        const updatedParent = await updateSubmittal(submittal.id, { round: maxRound }, activeUserRole || 'PM')
        setForm(f => ({ ...f, round: maxRound }))
        onUpdated(updatedParent)
      }
      
      await loadAttachments()
      setLog(await getActivityLog(submittal.id))
    } catch (err) {
      console.error('Update round failed:', err)
    }
  }

  const handleBumpRevision = async () => {
    try {
      setSaving(true)
      const nextRound = (submittal.round || 1) + 1
      const updateData = { round: nextRound, status: 'working', submitted_date: null }
      const updated = await updateSubmittal(submittal.id, updateData, activeUserRole || 'PM')
      
      const userDisplay = activeUser.user_metadata?.full_name || activeUser.email || 'User'
      await addActivity(submittal.id, `🚀 Submittal Bumped to Revision ${nextRound}`, userDisplay)
      
      setForm(f => ({ ...f, ...updateData }))
      setLog(await getActivityLog(submittal.id))
      onUpdated(updated)
    } catch (err) {
      console.error('Bump Rev failed:', err)
    } finally {
      setSaving(false)
    }
  }

  const handleBumpRevisionOverride = async (newRound) => {
    try {
      setSaving(true)
      const updateData = { round: newRound }
      const updated = await updateSubmittal(submittal.id, updateData, activeUserRole || 'PM')
      const userDisplay = activeUser.user_metadata?.full_name || activeUser.email || 'User'
      await addActivity(submittal.id, `🚀 Submittal Revision manually set to ${newRound}`, userDisplay)
      setForm(f => ({ ...f, ...updateData }))
      setLog(await getActivityLog(submittal.id))
      onUpdated(updated)
    } catch (err) {
      console.error('Bump Rev failed:', err)
    } finally {
      setSaving(false)
    }
  }

  const handlePrintLog = () => {
    try {
      const doc = generateActivityLogReport(submittal, log)
      const cleanFileName = (submittal.item_name || 'Submittal').replace(/[^a-zA-Z0-9]/g, '_')
      doc.save(`Activity_Log_${cleanFileName}.pdf`)
    } catch (err) {
      console.error('Failed to generate Activity Log PDF:', err)
    }
  }

  const handleOfficialSubmission = async () => {
    const d = new Date(new Date().toLocaleString("en-US", {timeZone: "America/Los_Angeles"}));
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
          
          if (att.type === 'submittal') {
            const freshSubs = await getAttachments(submittal.id, 'submittal')
            const maxRound = freshSubs.length > 0 ? Math.max(...freshSubs.map(a => a.round || 1)) : 1
            if (maxRound !== parseInt(form.round || 1)) {
              const updatedParent = await updateSubmittal(submittal.id, { round: maxRound }, activeUserRole || 'PM')
              setForm(f => ({ ...f, round: maxRound }))
              onUpdated(updatedParent)
            }
          }
          
          await loadAttachments()
          const userDisplay = activeUser.user_metadata?.full_name || activeUser.email || 'User'
          await addActivity(submittal.id, `🗑️ Deleted Document: "${att.file_name}"`, userDisplay)
          setLog(await getActivityLog(submittal.id))
          
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

      <div className="detail-panel-body" style={{ display: 'flex', flexDirection: 'column', padding: 0, overflow: 'hidden' }}>
        
        {/* Sleek Enterprise Tab Bar */}
        <div style={{ display: 'flex', width: '100%', flexShrink: 0, background: 'var(--bg-base)', borderBottom: '1px solid var(--border)' }}>
          <Tab active={activeTab === 'details'} onClick={() => setActiveTab('details')}>Details</Tab>
          <Tab active={activeTab === 'activity'} onClick={() => setActiveTab('activity')}>Activity</Tab>
          <Tab active={activeTab === 'documents'} onClick={() => setActiveTab('documents')}>Documents</Tab>
        </div>

        {/* Tab Content Canvas */}
        <div style={{ flex: 1, overflowY: activeTab === 'activity' ? 'hidden' : 'auto', padding: '20px', display: 'flex', flexDirection: 'column' }}>

        {/* --- DETAILS TAB --- */}
        {activeTab === 'details' && (
          <div className="detail-section" style={{ border: 'none', padding: 0, margin: 0 }}>
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
              <label className="field-label">Revision Level</label>
              <input 
                className="field-input" 
                type="number" 
                min="1" 
                value={form.round || 1} 
                onChange={set('round')} 
                onBlur={() => {
                  const r = parseInt(form.round || 1)
                  if (r !== (submittal.round || 1)) {
                    handleBumpRevisionOverride(r)
                  }
                }}
              />
            </div>
          </div>

          <div className="field-row-2">
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
              <label className="field-label">Expected Return Date</label>
              <input className="field-input" type="date" disabled value={expectedDateStr || ''} />
            </div>
          </div>

          {/* Elevated Next Action Field */}
          <div className="field-row" style={{ marginBottom: '24px', background: 'var(--bg-surface-elevated)', border: '1px dashed var(--accent)', borderRadius: '8px', padding: '12px' }}>
            <label className="field-label" style={{ color: 'var(--accent)', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.5px' }}>🎯 Next Action</label>
            <textarea className="field-textarea" rows={2}
              placeholder="What needs to happen next..."
              value={form.next_action || ''}
              onChange={set('next_action')}
              id="detail-next-action"
              style={{ background: 'transparent', border: 'none', padding: 0, marginTop: '8px', fontSize: '13px', resize: 'none' }}
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
        )}

        {/* --- ACTIVITY TAB --- */}
        {activeTab === 'activity' && (
          <div className="detail-section" style={{ border: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', height: '100%' }}>
          <div className="activity-feed-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div className="detail-section-title" style={{ marginBottom: 0 }}>Activity Log</div>
            <button className="btn btn-icon btn-sm" onClick={handlePrintLog} title="Print Fully Formatted Activity Log" style={{ color: 'var(--text-muted)' }}>
              <Printer size={14} />
            </button>
          </div>
          <div className="activity-messages" ref={feedRef} style={{ flex: 1, overflowY: 'auto', paddingRight: '8px', display: 'flex', flexDirection: 'column' }}>
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
                  if (p.email) return p.user_metadata?.full_name || p.email.split('@')[0]
                  if (p.user_metadata) return p.user_metadata.full_name || 'User'
                  if (p.id) return `System Action [${p.id.slice(0,8)}]`
                  return '[Archive Data]'
                } catch { return val }
              }

              let displayAuthor = clean(entry.author || 'System Auto')
              if (displayAuthor && displayAuthor.includes('@')) {
                displayAuthor = displayAuthor.split('@')[0]
              }
              
              let displayMsg = clean(entry.message)
              if (typeof displayMsg === 'string' && displayMsg.includes('Auto-Audit:')) return null
              displayMsg = displayMsg.replace(/\[R\d+\] Submittal Document uploaded: ".+?"/, '📎 Uploaded Document')
              displayMsg = displayMsg.replace(/O&M Document uploaded: ".+?"/, '📕 Uploaded O&M Document')
              displayMsg = displayMsg.replace(/Reference File uploaded: ".+?"/, '🔗 Uploaded Reference File')
              displayMsg = displayMsg.replace(/🔄 Re-classified ".+?" to Revision (\d+)/, '🔄 Changed to Revision $1')
              displayMsg = displayMsg.replace(/📤 OFFICIAL SUBMISSION FILED/, '📤 Marked as Official Submission')
              displayMsg = displayMsg.replace(/✅ Stamped .+? as Officially Approved Version/, '✅ Approved')
              displayMsg = displayMsg.replace(/⏪ Revoked Approval Stamp from .+?/, '⏪ Revoked Approval')
              displayMsg = displayMsg.replace(/🗑️ Deleted Document: ".+?"/, '🗑️ Deleted Document')
              displayMsg = displayMsg.replace(/🚀 Submittal Bumped to Revision \d+/, '🚀 Bumped Revision')
              displayMsg = displayMsg.replace(/Created submittal: .+/, '🆕 Created Submittal')
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
          <div className="activity-add" style={{ marginTop: '16px', flexShrink: 0, display: 'flex', gap: '8px' }}>
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
        )}

        {/* --- DOCUMENTS TAB --- */}
        {activeTab === 'documents' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {/* Submittal Documents */}
            <AttachmentSection
          title="Submittal Documents"
          files={attachments}
          uploading={uploading}
          fileRef={fileRef}
          onUpload={e => handleUpload(e, 'submittal')}
          onDelete={handleDeleteAttachment}
          onApprove={handleApproveAttachment}
          onChangeRound={handleUpdateAttRound}
          showRounds={true}
          accentColor="var(--accent)"
          hint="Cut sheets, drawings, stamps"
          action={
            (form.status === 'revise_resubmit' || form.status === 'rejected') ? (
              <button
                className="btn btn-primary btn-sm"
                onClick={handleBumpRevision}
                style={{ padding: '4px 12px', fontSize: 10, background: 'var(--s-revise)', color: '#000' }}
                title={`Advance to Revision ${(submittal.round || 1) + 1}`}
              >
                🚀 Bump to Rev {(submittal.round || 1) + 1}
              </button>
            ) : attachments.length > 0 && !['submitted', 'in_review', 'approved'].includes(form.status) ? (
              <button
                className="btn btn-primary btn-sm"
                onClick={handleOfficialSubmission}
                style={{ padding: '4px 12px', fontSize: 10, background: 'var(--s-submit)', color: '#000' }}
                title="Flip to Submitted & set Date"
              >
                <Send size={11} /> Official Submission
              </button>
            ) : null
          }
        />

        {/* Reference Documents */}
        <AttachmentSection
          title="Reference Files"
          files={refAttachments}
          uploading={uploadingRef}
          fileRef={refFileRef}
          onUpload={e => handleUpload(e, 'reference')}
          onDelete={handleDeleteAttachment}
          accentColor="var(--text-sub)"
          hint="Plans, emails, RFI responses, misc info."
          icon={<Paperclip size={12} />}
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
        )}
        
        </div>
      </div>

      <ConfirmModal
        {...confirm}
        onCancel={() => setConfirm(c => ({ ...c, isOpen: false }))}
      />
    </div>
  )
}

function AttachmentSection({ title, files, uploading, fileRef, onUpload, onDelete, accentColor, hint, icon, action, onApprove, onChangeRound, showRounds }) {
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
            <div key={att.id} className="attachment-item" style={att.is_approved_version ? { borderColor: 'rgba(16,185,129,0.5)', background: 'rgba(16,185,129,0.05)' } : {}}>
              <FileText size={14} style={{ color: accentColor, flexShrink: 0 }} />
              
              {showRounds && (
                <select 
                  value={att.round || 1} 
                  onChange={(e) => onChangeRound && onChangeRound(att, parseInt(e.target.value))}
                  style={{ 
                    fontSize: 10, fontWeight: 800, color: 'var(--text)', 
                    background: 'var(--bg-overlay)', padding: '2px 4px', 
                    borderRadius: 4, marginRight: 6, border: '1px solid var(--border)', cursor: 'pointer',
                    outline: 'none'
                  }}
                  title="Change Document Revision"
                >
                  {[1,2,3,4,5,6,7,8,9,10].map(r => <option key={r} value={r}>R{r}</option>)}
                </select>
              )}

              <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 6, overflow: 'hidden' }}>
                <span className="attachment-name" title={att.file_name} style={{ flex: 'none', maxWidth: '100%', color: att.is_approved_version ? 'var(--s-approved)' : 'var(--text-sub)', fontWeight: att.is_approved_version ? 600 : 400 }}>
                  {att.file_name}
                </span>
                {att.is_approved_version && (
                  <span style={{ fontSize: 9, fontWeight: 800, color: 'var(--s-approved)', background: 'var(--s-approved-bg)', padding: '2px 6px', borderRadius: 4 }}>APPROVED</span>
                )}
              </div>

              <a href={att.file_url} target="_blank" rel="noopener noreferrer"
                 className="btn btn-icon btn-sm" title="Open" style={{ border: 'none' }}>
                <ExternalLink size={12} />
              </a>

              {onApprove && (
                <button className="btn btn-icon btn-sm"
                  onClick={() => onApprove(att, !att.is_approved_version)}
                  title={att.is_approved_version ? "Revoke Final Approval" : "Mark as Final Approved Version"}
                  style={{ border: 'none', color: att.is_approved_version ? 'var(--s-rejected)' : 'var(--text-muted)' }}>
                  {att.is_approved_version ? <X size={12} /> : <Star size={12} />}
                </button>
              )}

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

function Tab({ active, onClick, children }) {
  return (
    <div 
      onClick={onClick}
      style={{
        flex: 1, 
        textAlign: 'center', 
        padding: '14px 0', 
        cursor: 'pointer',
        fontSize: 12,
        fontWeight: active ? 700 : 500,
        color: active ? 'var(--text)' : 'var(--text-muted)',
        borderBottom: active ? '2px solid var(--accent)' : '2px solid transparent',
        transition: 'all 0.2s',
        background: active ? 'transparent' : 'rgba(0,0,0,0.01)',
        letterSpacing: '0.3px',
        userSelect: 'none'
      }}
    >
      {children}
    </div>
  )
}

