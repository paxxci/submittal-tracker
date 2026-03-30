import React, { useState, useEffect } from 'react'
import { Plus, Trash2, Save, Users } from 'lucide-react'
import { getContacts, createContact, deleteContact, updateProject } from '../services/api'

const ROLE_CONFIG = {
  gc:         { label: 'GC',         color: 'var(--bic-gc)'       },
  engineer:   { label: 'Engineer',   color: 'var(--bic-engineer)'  },
  architect:  { label: 'Architect',  color: 'var(--bic-architect)' },
  vendor:     { label: 'Vendor',     color: 'var(--bic-vendor)'    },
  pm:         { label: 'PM',         color: 'var(--bic-pm)'        },
  owner:      { label: 'Owner',      color: 'var(--text-sub)'      },
  manufacturer: { label: 'Manufacturer', color: 'var(--accent)'   },
  other:      { label: 'Other',      color: 'var(--text-sub)'      },
}

export default function Settings({ project, onProjectUpdated }) {
  const [contacts, setContacts] = useState([])
  const [showForm, setShowForm] = useState(false)
  const [contactForm, setContactForm] = useState({ name: '', company: '', role: 'vendor', email: '' })
  const [saving, setSaving] = useState(false)

  // Project edit form
  const [projectForm, setProjectForm] = useState({ name: '', number: '', client: '', address: '' })
  const [savingProject, setSavingProject] = useState(false)
  const [projectSaved, setProjectSaved] = useState(false)

  useEffect(() => {
    if (project) {
      setProjectForm({
        name: project.name || '',
        number: project.number || '',
        client: project.client || '',
        address: project.address || '',
      })
      loadContacts()
    } else {
      setContacts([])
    }
  }, [project?.id])

  const loadContacts = async () => {
    try { setContacts(await getContacts(project.id)) }
    catch {}
  }

  const setContact = f => e => setContactForm(p => ({ ...p, [f]: e.target.value }))
  const setProj = f => e => setProjectForm(p => ({ ...p, [f]: e.target.value }))

  const handleSaveProject = async (e) => {
    e.preventDefault()
    if (!projectForm.name.trim()) return
    try {
      setSavingProject(true)
      const updated = await updateProject(project.id, projectForm)
      if (onProjectUpdated) onProjectUpdated(updated)
      setProjectSaved(true)
      setTimeout(() => setProjectSaved(false), 2000)
    } catch (err) {
      console.error('Failed to update project:', err)
    } finally {
      setSavingProject(false)
    }
  }

  const handleAddContact = async (e) => {
    e.preventDefault()
    if (!contactForm.name.trim()) return
    try {
      setSaving(true)
      await createContact({ ...contactForm, project_id: project.id })
      setContactForm({ name: '', company: '', role: 'vendor', email: '' })
      setShowForm(false)
      loadContacts()
    } finally { setSaving(false) }
  }

  const handleDeleteContact = async (id) => {
    if (!confirm('Remove this person?')) return
    await deleteContact(id)
    setContacts(c => c.filter(x => x.id !== id))
  }

  const initials = (name) => name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()

  return (
    <>
      <div className="top-bar">
        <span className="top-bar-title">Project Settings</span>
        {project && <span className="top-bar-sub" style={{ marginLeft: 8 }}>— {project.name}</span>}
      </div>

      <div className="stage-body" style={{ maxWidth: 600 }}>
        {!project ? (
          <div className="empty-state" style={{ marginTop: 64 }}>
            <div className="empty-state-title">No project open</div>
            <div className="empty-state-sub">Open a project from the dashboard to edit its settings.</div>
          </div>
        ) : (
          <>
            {/* ── Project Details ───────────────────────────────── */}
            <div className="settings-section">
              <div className="settings-section-title">Project Details</div>
              <form onSubmit={handleSaveProject}>
                <div className="form-group" style={{ marginBottom: 10 }}>
                  <label className="form-label">Project Name <span className="form-required">*</span></label>
                  <input
                    className="form-input"
                    value={projectForm.name}
                    onChange={setProj('name')}
                    required
                    id="settings-project-name"
                  />
                </div>
                <div className="form-grid-2" style={{ marginBottom: 10 }}>
                  <div className="form-group">
                    <label className="form-label">Project Number</label>
                    <input className="form-input" value={projectForm.number} onChange={setProj('number')} id="settings-project-number" />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Client / GC</label>
                    <input className="form-input" value={projectForm.client} onChange={setProj('client')} id="settings-project-client" />
                  </div>
                </div>
                <div className="form-group" style={{ marginBottom: 14 }}>
                  <label className="form-label">Project Address</label>
                  <input className="form-input" value={projectForm.address} onChange={setProj('address')} id="settings-project-address" />
                </div>
                <button
                  type="submit"
                  className="btn btn-primary btn-sm"
                  disabled={savingProject}
                  id="btn-save-project"
                >
                  <Save size={12} />
                  {projectSaved ? 'Saved ✓' : savingProject ? 'Saving...' : 'Save Changes'}
                </button>
              </form>
            </div>

            {/* ── Project Team ─────────────────────────────────── */}
            <div className="settings-section">
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 6 }}>
                <div>
                  <div className="settings-section-title" style={{ marginBottom: 2 }}>
                    <Users size={13} style={{ display: 'inline', marginRight: 6, verticalAlign: 'middle' }} />
                    Project Team
                  </div>
                  <p style={{ fontSize: 11, color: 'var(--text-muted)', lineHeight: 1.5, marginBottom: 12 }}>
                    Add everyone involved — GC, engineers, architects, vendors, manufacturers. They'll appear in the <strong style={{ color: 'var(--text-sub)' }}>Ball In Court</strong> dropdown when tracking submittals.
                  </p>
                </div>
                <button className="btn btn-ghost btn-sm" style={{ flexShrink: 0 }} onClick={() => setShowForm(f => !f)} id="btn-add-person">
                  <Plus size={12} /> Add Person
                </button>
              </div>

              {showForm && (
                <form onSubmit={handleAddContact} style={{ background: 'var(--bg-overlay)', border: '1px solid var(--border)', borderRadius: 8, padding: 14, marginBottom: 12 }}>
                  <div className="form-grid-2" style={{ marginBottom: 10 }}>
                    <div className="form-group">
                      <label className="form-label">Name <span className="form-required">*</span></label>
                      <input className="form-input" style={{ fontSize: 12, padding: '7px 10px' }} placeholder="e.g. John Smith or ABB" value={contactForm.name} onChange={setContact('name')} required autoFocus id="input-contact-name" />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Company</label>
                      <input className="form-input" style={{ fontSize: 12, padding: '7px 10px' }} placeholder="e.g. Smith Engineering" value={contactForm.company} onChange={setContact('company')} id="input-contact-company" />
                    </div>
                  </div>
                  <div className="form-grid-2" style={{ marginBottom: 10 }}>
                    <div className="form-group">
                      <label className="form-label">Role</label>
                      <select className="form-select" style={{ fontSize: 12, padding: '7px 10px' }} value={contactForm.role} onChange={setContact('role')} id="select-contact-role">
                        {Object.entries(ROLE_CONFIG).map(([v, { label }]) => (
                          <option key={v} value={v}>{label}</option>
                        ))}
                      </select>
                    </div>
                    <div className="form-group">
                      <label className="form-label">Email</label>
                      <input className="form-input" style={{ fontSize: 12, padding: '7px 10px' }} placeholder="optional" type="email" value={contactForm.email} onChange={setContact('email')} id="input-contact-email" />
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                    <button type="button" className="btn btn-ghost btn-sm" onClick={() => setShowForm(false)}>Cancel</button>
                    <button type="submit" className="btn btn-primary btn-sm" disabled={saving} id="btn-save-contact">{saving ? 'Adding...' : 'Add to Team'}</button>
                  </div>
                </form>
              )}

              {contacts.length === 0 && !showForm ? (
                <div style={{ color: 'var(--text-muted)', fontSize: 12, textAlign: 'center', padding: '16px 0', borderTop: '1px solid var(--border)' }}>
                  No team members yet. Add your GC, engineer, or a vendor like ABB.
                </div>
              ) : (
                contacts.map(c => {
                  const roleCfg = ROLE_CONFIG[c.role] || ROLE_CONFIG.other
                  return (
                    <div key={c.id} className="contact-item" id={`contact-${c.id}`}>
                      <div className="contact-avatar" style={{ background: `${roleCfg.color}18`, color: roleCfg.color }}>
                        {initials(c.name)}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div className="contact-name">{c.name}</div>
                        <div className="contact-meta">
                          <span style={{ color: roleCfg.color, fontWeight: 600, fontSize: 10 }}>{roleCfg.label}</span>
                          {c.company && <span> · {c.company}</span>}
                          {c.email && <span> · {c.email}</span>}
                        </div>
                      </div>
                      <button className="btn btn-icon btn-sm" style={{ color: 'var(--s-rejected)', border: 'none' }}
                        onClick={() => handleDeleteContact(c.id)} title="Remove">
                        <Trash2 size={12} />
                      </button>
                    </div>
                  )
                })
              )}
            </div>
          </>
        )}
      </div>
    </>
  )
}
