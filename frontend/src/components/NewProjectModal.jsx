import React, { useState } from 'react'
import { X } from 'lucide-react'
import { createProject } from '../services/project_service'

export default function NewProjectModal({ onClose, onCreated, organizationId }) {
  const [form, setForm] = useState({ name: '', number: '', client: '', address: '' })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)

  const set = (field) => (e) => setForm(f => ({ ...f, [field]: e.target.value }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.name.trim()) return setError('Project name is required.')
    try {
      setSaving(true)
      setError(null)
      await createProject({ ...form, organizationId })
      onCreated()
    } catch (err) {
      setError(err.message || 'Failed to create project.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="modal-backdrop" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal" id="modal-new-project">
        <div className="modal-header">
          <span className="modal-title">New Project</span>
          <button className="btn btn-icon" onClick={onClose}><X size={16} /></button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <div className="form-group">
              <label className="form-label">Project Name <span className="form-required">*</span></label>
              <input
                className="form-input"
                placeholder="e.g. City Center Plaza"
                value={form.name}
                onChange={set('name')}
                autoFocus
                id="input-project-name"
              />
            </div>

            <div className="form-group">
              <label className="form-label">Project Number</label>
              <input
                className="form-input"
                placeholder="e.g. PEC-2024-001"
                value={form.number}
                onChange={set('number')}
                id="input-project-number"
              />
            </div>

            <div className="form-group">
              <label className="form-label">Project Address</label>
              <input
                className="form-input"
                placeholder="e.g. 1234 Main St, Phoenix AZ"
                value={form.address}
                onChange={set('address')}
                id="input-project-address"
              />
            </div>

            {error && (
              <div style={{ color: 'var(--s-rejected)', fontSize: 12, background: 'rgba(239,68,68,0.08)', padding: '8px 12px', borderRadius: 6 }}>
                {error}
              </div>
            )}
          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-ghost" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={saving} id="btn-create-project">
              {saving ? 'Creating...' : 'Create Project'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
