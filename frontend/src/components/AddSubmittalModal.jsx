import React, { useState, useEffect } from 'react'
import { X } from 'lucide-react'
import { createSubmittal, getContacts, resolveSpecSectionId } from '../services/api'
import { STATUS_OPTIONS, BIC_OPTIONS } from './StatusBadge'

const DIVIDER = '──────────────'

export default function AddSubmittalModal({ projectId, activeUser, onClose, onCreated }) {
  const [form, setForm] = useState({
    spec_section: '',
    item_name: '',
    status: 'not_started',
    bic: 'you',
    priority: 'medium',
    next_action: '',
    due_date: '',
    round: 1,
  })
  const [contacts, setContacts] = useState([])
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (projectId) getContacts(projectId).then(setContacts).catch(() => {})
  }, [projectId])

  const set = (field) => (e) => setForm(f => ({ ...f, [field]: e.target.value }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.item_name.trim()) return setError('Description is required.')
    try {
      setSaving(true)
      setError(null)
      
      const spec_section_id = await resolveSpecSectionId(projectId, form.spec_section)
      
      await createSubmittal({ 
        ...form, 
        project_id: projectId, 
        spec_section_id,
        round: Number(form.round) 
      }, activeUser)
      onCreated()
    } catch (err) {
      setError(err.message || 'Failed to create submittal.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="modal-backdrop" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal" style={{ maxWidth: 520 }} id="modal-add-submittal">
        <div className="modal-header">
          <span className="modal-title">Add Submittal</span>
          <button className="btn btn-icon" onClick={onClose}><X size={16} /></button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <div className="form-grid-2">
              <div className="form-group">
                <label className="form-label">Spec Section #</label>
                <input className="form-input" placeholder="e.g. 26 05 19" value={form.spec_section} onChange={set('spec_section')} id="input-spec-section" />
              </div>
              <div className="form-group">
                <label className="form-label">Description <span className="form-required">*</span></label>
                <input className="form-input" placeholder="e.g. Low Voltage Conductors" value={form.item_name} onChange={set('item_name')} autoFocus id="input-item-name" />
              </div>
            </div>

            <div className="form-grid-2">
              <div className="form-group">
                <label className="form-label">Status</label>
                <select className="form-select" value={form.status} onChange={set('status')} id="select-status">
                  {STATUS_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Ball In Court</label>
                <select className="form-select" value={form.bic} onChange={set('bic')} id="select-bic">
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

            <div className="form-grid-2">
              <div className="form-group">
                <label className="form-label">Priority</label>
                <select className="form-select" value={form.priority} onChange={set('priority')} id="select-priority">
                  <option value="high">High</option>
                  <option value="medium">Medium</option>
                  <option value="low">Low</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Revision #</label>
                <input className="form-input" type="number" min="1" value={form.round} onChange={set('round')} id="input-round" />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Due Date</label>
              <input className="form-input" type="date" value={form.due_date} onChange={set('due_date')} id="input-due-date" />
            </div>

            <div className="form-group">
              <label className="form-label">Next Action</label>
              <input className="form-input" placeholder="e.g. Follow up with EOR on 4/5 if no response" value={form.next_action} onChange={set('next_action')} id="input-next-action" />
            </div>

            {error && (
              <div style={{ color: 'var(--s-rejected)', fontSize: 12, background: 'rgba(239,68,68,0.08)', padding: '8px 12px', borderRadius: 6 }}>
                {error}
              </div>
            )}
          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-ghost" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={saving} id="btn-create-submittal">
              {saving ? 'Adding...' : 'Add Submittal'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
