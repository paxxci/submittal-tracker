import React, { useState, useEffect } from 'react'
import { Plus, Trash2, Save, Users, Archive, Package, AlertTriangle, RefreshCw, X, Shield, Printer, Link, Check } from 'lucide-react'
import JSZip from 'jszip'
import { saveAs } from 'file-saver'
import { getContacts, createContact, deleteContact } from '../services/contact_service'
import { 
  updateProject, 
  archiveProject, 
  restoreProject, 
  purgeProjectFiles, 
  deleteProject, 
  purgeProjectArchive 
} from '../services/project_service'
import { getProjectMembers, addProjectMember, removeProjectMember } from '../services/member_service'
import { getSubmittals } from '../services/submittal_service'
import { getAttachments } from '../services/attachment_service'
import { generateProjectReport } from '../services/reports'

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

export default function Settings({ project, onProjectUpdated, activeUserRole }) {
  const [contacts, setContacts] = useState([])
  const [showForm, setShowForm] = useState(false)
  const [contactForm, setContactForm] = useState({ name: '', company: '', role: 'vendor', email: '' })
  const [saving, setSaving] = useState(false)

  // Project edit form
  const [projectForm, setProjectForm] = useState({ name: '', number: '', client: '', address: '' })
  const [savingProject, setSavingProject] = useState(false)
  const [projectSaved, setProjectSaved] = useState(false)

  // Delete Modal
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [deleteConfirmInput, setDeleteConfirmInput] = useState('')
  const [isDeleting, setIsDeleting] = useState(false)

  // Team Access
  const [members, setMembers] = useState([])
  const [showMemberForm, setShowMemberForm] = useState(false)
  const [memberForm, setMemberForm] = useState({ name: '', email: '', role: 'editor' })
  const [addingMember, setAddingMember] = useState(false)
  const [copiedEmail, setCopiedEmail] = useState(null)
  const [inviteSuccess, setInviteSuccess] = useState(null)

  const isAdmin = activeUserRole === 'admin'

  useEffect(() => {
    if (project) {
      setProjectForm({
        name: project.name || '',
        number: project.number || '',
        client: project.client || '',
        address: project.address || '',
      })
      loadContacts()
      loadMembers()
    } else {
      setContacts([])
      setMembers([])
    }
  }, [project?.id])

  const loadContacts = async () => {
    if (!project?.id) return
    try { setContacts(await getContacts(project.id)) }
    catch {}
  }

  const loadMembers = async () => {
    if (!project?.id) return
    try { setMembers(await getProjectMembers(project.id)) }
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

  const handleAddMember = async (e) => {
    e.preventDefault()
    if (!memberForm.email.trim()) return
    try {
      setAddingMember(true)
      await addProjectMember(project.id, memberForm.email, memberForm.role, memberForm.name)
      setInviteSuccess(memberForm.email)
      setMemberForm({ name: '', email: '', role: 'editor' })
      setShowMemberForm(false)
      loadMembers()
      setTimeout(() => setInviteSuccess(null), 10000)
    } catch (err) {
      alert('Failed to add member. They might already have access.')
    } finally { setAddingMember(false) }
  }

  const handleRemoveMember = async (id, email) => {
    if (email === 'PM') return alert('Cannot remove the Project Manager role.')
    if (!confirm(`Revoke project access for "${email}"?`)) return
    try {
      await removeProjectMember(id)
      setMembers(m => m.filter(x => x.id !== id))
    } catch {}
  }

  const handleCopyInvite = (email) => {
    const inviteLink = `${window.location.origin}/?signup=true&email=${encodeURIComponent(email)}`
    navigator.clipboard.writeText(inviteLink)
    setCopiedEmail(email)
    setTimeout(() => setCopiedEmail(null), 2000)
  }

  // ─── Project Closeout ──────────────────────────────────────────────
  const [zipping, setZipping] = useState(false)
  const [archiving, setArchiving] = useState(false)
  const [purging, setPurging] = useState(false)

  const handleDownloadReport = async () => {
    try {
      const subs = await getSubmittals(project.id)
      const doc = generateProjectReport(project, subs)
      doc.save(`${project.number || 'PROJECT'}_SUBMITTAL_LOG_${new Date().toISOString().split('T')[0]}.pdf`)
    } catch (err) {
      console.error('Report failed:', err)
      alert('Failed to generate PDF report.')
    }
  }

  const handleDownloadPackage = async () => {
    try {
      setZipping(true)
      const subs = await getSubmittals(project.id)
      const approved = subs.filter(s => s.status === 'approved')
      
      if (!approved.length) {
        alert('No approved submittals found to package.')
        return
      }

      const zip = new JSZip()
      const folder = zip.folder(`${project.name}_Approved_Package`)
      
      let fileCount = 0
      for (const s of approved) {
        // Only include approved versions! 🏆
        const atts = s.attachments?.filter(a => a.is_approved_version) || []
        
        for (const a of atts) {
          try {
            const resp = await fetch(a.file_url)
            const blob = await resp.blob()
            const specCode = s.spec_sections?.csi_code?.replace(/\s/g, '') || 'GENERAL'
            folder.file(`${specCode}/${a.file_name}`, blob)
            fileCount++
          } catch (e) { console.error('Failed to add file to zip:', a.file_name) }
        }
      }

      if (fileCount === 0) {
        alert('Found approved submittals, but none have a "Final Approved Version" marked. Please mark them in the detail panel first. 🛡️🔐')
        return
      }

      // Add the Professional Log Report to the root of the ZIP
      const doc = generateProjectReport(project, subs)
      const pdfBlob = doc.output('blob')
      folder.file(`00_${project.number || 'PROJECT'}_SUBMITTAL_LOG.pdf`, pdfBlob)

      const content = await zip.generateAsync({ type: 'blob' })
      saveAs(content, `${project.name.replace(/\s/g, '_')}_Approved_Package.zip`)
    } catch (err) {
      console.error('ZIP failed:', err)
      alert('Failed to generate ZIP package.')
    } finally {
      setZipping(false)
    }
  }

  const handlePurgeArchive = async () => {
    if (!confirm('ARCHIVE PURGE: This will delete ALL old revisions except for the "Final Approved Versions". This is permanent and saves storage space. Proceed? 🛡️🗑️')) return
    try {
      setPurging(true)
      await purgeProjectArchive(project.id)
      alert('Non-approved revision files have been purged. 🛡️✅')
    } finally { setPurging(false) }
  }

  const handleToggleArchive = async () => {
    const isArchiving = !project?.is_archived
    if (isArchiving && !confirm('Archive this project? It will be hidden from the active dashboard.')) return
    
    try {
      setArchiving(true)
      const updated = isArchiving ? await archiveProject(project.id) : await restoreProject(project.id)
      if (onProjectUpdated) onProjectUpdated(updated)
    } finally { setArchiving(false) }
  }

  const handlePurge = async () => {
    if (!confirm('CRITICAL: This will PERMANENTLY delete all uploaded PDF files for this project from cloud storage to free up space. The submittal log (text data) will remain. PROCEED?')) return
    try {
      setPurging(true)
      await purgeProjectFiles(project.id)
      alert('Storage purged. Project files have been deleted.')
    } finally { setPurging(false) }
  }

  const handleDeleteProject = async () => {
    if (deleteConfirmInput !== 'DELETE') return
    
    try {
      setIsDeleting(true)
      await deleteProject(project.id)
      alert('Project deleted.')
      window.location.reload()
    } catch (err) {
      console.error('Delete failed:', err)
      alert('Failed to delete project.')
    } finally {
      setIsDeleting(false)
    }
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
                    disabled={!isAdmin}
                    id="settings-project-name"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Project Number</label>
                  <input className="form-input" value={projectForm.number} onChange={setProj('number')} disabled={!isAdmin} id="settings-project-number" />
                </div>
                <div className="form-group" style={{ marginBottom: 14 }}>
                  <label className="form-label">Project Address</label>
                  <input className="form-input" value={projectForm.address} onChange={setProj('address')} disabled={!isAdmin} id="settings-project-address" />
                </div>
                {isAdmin && (
                  <button
                    type="submit"
                    className="btn btn-primary btn-sm"
                    disabled={savingProject}
                    id="btn-save-project"
                  >
                    <Save size={12} />
                    {projectSaved ? 'Saved ✓' : savingProject ? 'Saving...' : 'Save Changes'}
                  </button>
                )}
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

              <div style={{ display: 'grid', gap: 8 }}>
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
            </div>

            {/* ── Team Access ───────────────────────────────────── */}
            <div className="settings-section">
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 6 }}>
                <div>
                  <div className="settings-section-title" style={{ marginBottom: 2 }}>
                    <Users size={13} style={{ display: 'inline', marginRight: 6, verticalAlign: 'middle' }} />
                    Team Access & Permissions
                  </div>
                  <p style={{ fontSize: 11, color: 'var(--text-muted)', lineHeight: 1.5, marginBottom: 12 }}>
                    Manage who has keys to this job. Only people on this list can see the project on their dashboard.
                  </p>
                </div>
                <button className="btn btn-ghost btn-sm" style={{ flexShrink: 0 }} onClick={() => setShowMemberForm(f => !f)} id="btn-add-member">
                  <Plus size={12} /> Add Member
                </button>
              </div>

              {inviteSuccess && (
                <div style={{ background: 'rgba(34,197,94,0.1)', border: '1px solid var(--s-approved)', color: 'var(--s-approved)', padding: '12px 16px', borderRadius: 8, marginBottom: 16, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ fontSize: 13 }}>
                    <div style={{ fontWeight: 700 }}>Member Added! 🛡️✨</div>
                    <div style={{ opacity: 0.8, fontSize: 12 }}>Invite link ready for <strong>{inviteSuccess}</strong></div>
                  </div>
                  <button className="btn btn-primary btn-sm" onClick={() => handleCopyInvite(inviteSuccess)}>
                    Copy Link
                  </button>
                </div>
              )}

              {showMemberForm && (
                <form onSubmit={handleAddMember} style={{ background: 'var(--bg-overlay)', border: '1px solid var(--border)', borderRadius: 8, padding: 14, marginBottom: 12 }}>
                  <div className="form-group" style={{ marginBottom: 10 }}>
                    <label className="form-label">Member Name <span className="form-required">*</span></label>
                    <input className="form-input" style={{ fontSize: 12, padding: '7px 10px' }} placeholder="e.g. John Smith" value={memberForm.name} onChange={e => setMemberForm(m => ({ ...m, name: e.target.value }))} required id="input-member-name" />
                  </div>
                  <div className="form-grid-2" style={{ marginBottom: 10 }}>
                    <div className="form-group">
                      <label className="form-label">Email <span className="form-required">*</span></label>
                      <input className="form-input" style={{ fontSize: 12, padding: '7px 10px' }} placeholder="e.g. john@email.com" value={memberForm.email} onChange={e => setMemberForm(m => ({ ...m, email: e.target.value }))} required id="input-member-email" />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Permission Level</label>
                      <select className="form-select" style={{ fontSize: 12, padding: '7px 10px' }} value={memberForm.role} onChange={e => setMemberForm(m => ({ ...m, role: e.target.value }))} id="select-member-role">
                        <option value="admin">Admin (Full Control)</option>
                        <option value="editor">Editor (Can Track)</option>
                        <option value="viewer">Viewer (Read Only)</option>
                      </select>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                    <button type="button" className="btn btn-ghost btn-sm" onClick={() => setShowMemberForm(false)}>Cancel</button>
                    <button type="submit" className="btn btn-primary btn-sm" disabled={addingMember} id="btn-save-member">{addingMember ? 'Granting Access...' : 'Grant Access'}</button>
                  </div>
                </form>
              )}

              <div style={{ display: 'grid', gap: 4 }}>
                {members.map(m => (
                  <div key={m.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 12px', background: 'var(--bg-card)', borderRadius: 6, border: '1px solid var(--border)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-sub)' }}>{m.name || m.email}</div>
                      {m.name && <div style={{ fontSize: 11, color: 'var(--text-dim)', marginLeft: 4 }}>({m.email})</div>}
                      <span style={{ fontSize: 10, fontWeight: 800, textTransform: 'uppercase', color: 'var(--accent)', background: 'rgba(0,186,198,0.1)', padding: '1px 6px', borderRadius: 4, marginLeft: 8 }}>
                        {m.role}
                      </span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <button 
                        className="btn btn-ghost btn-sm" 
                        style={{ position: 'relative', fontSize: 11, padding: '4px 8px', color: copiedEmail === m.email ? 'var(--s-approved)' : 'var(--text-dim)', background: copiedEmail === m.email ? 'rgba(34,197,94,0.1)' : 'transparent' }}
                        onClick={() => handleCopyInvite(m.email)}
                      >
                        {copiedEmail === m.email ? 'Link Copied!' : 'Copy Invite Link'}
                        {copiedEmail === m.email && (
                          <span style={{ position: 'absolute', top: -24, right: 0, fontSize: 10, background: 'var(--bg-overlay)', padding: '2px 6px', borderRadius: 4, border: '1px solid var(--border)', whiteSpace: 'nowrap', zIndex: 10 }}>
                            Ready to Send! ✅
                          </span>
                        )}
                      </button>
                      <button 
                        className="btn btn-icon btn-sm" 
                        style={{ color: 'var(--s-rejected)', border: 'none', opacity: m.email === 'PM' ? 0.3 : 1 }}
                        onClick={() => handleRemoveMember(m.id, m.email)}
                        disabled={m.email === 'PM'}
                        title="Revoke Access"
                      >
                        <X size={12} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* ── Project Closeout ─────────────────────────────────── */}
            <div className="settings-section" style={{ border: '1px solid var(--s-rejected)', background: 'rgba(239, 68, 68, 0.03)', marginTop: 40 }}>
              <div className="settings-section-title" style={{ color: 'var(--s-rejected)', display: 'flex', alignItems: 'center', gap: 8 }}>
                <Archive size={14} /> Project Closeout & Archiving
              </div>
              <p style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 16 }}>
                Once a project is complete, use these tools to package your records and manage storage space.
              </p>

              <div style={{ display: 'grid', gap: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: 12, background: 'var(--bg-overlay)', borderRadius: 8, border: '1px solid var(--border)' }}>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-sub)', marginBottom: 2 }}>Export Approved Package</div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Bundle all approved documents + digital log into a single ZIP.</div>
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button 
                      className="btn btn-ghost btn-sm" 
                      onClick={handleDownloadReport}
                      title="Download Log PDF"
                    >
                      <Printer size={12} /> Log PDF
                    </button>
                    <button 
                      className="btn btn-ghost btn-sm" 
                      onClick={handleDownloadPackage} 
                      disabled={zipping}
                    >
                      {zipping ? <RefreshCw size={12} className="animate-spin" /> : <Package size={12} />} 
                      {zipping ? 'Bundling...' : 'Download ZIP'}
                    </button>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: 12, background: 'var(--bg-overlay)', borderRadius: 8, border: '1px solid var(--border)' }}>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-sub)', marginBottom: 2 }}>
                      {project?.is_archived ? 'Restore Project' : 'Archive Project'}
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                      {project?.is_archived ? 'Move project back to the active dashboard.' : 'Hide this project from the active dashboard.'}
                    </div>
                  </div>
                  <button 
                    className="btn btn-ghost btn-sm" 
                    onClick={handleToggleArchive}
                    disabled={archiving}
                  >
                    <Archive size={12} /> {archiving ? 'Saving...' : project?.is_archived ? 'Restore' : 'Archive'}
                  </button>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: 12, background: 'rgba(239, 68, 68, 0.05)', borderRadius: 8, border: '1px solid rgba(239, 68, 68, 0.2)' }}>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--s-rejected)', marginBottom: 2, display: 'flex', alignItems: 'center', gap: 6 }}>
                      <AlertTriangle size={12} /> Purge Storage
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Permanently delete all PDFs in this project to save cloud space.</div>
                  </div>
                  <button 
                    className="btn btn-ghost btn-sm" 
                    style={{ color: 'var(--s-rejected)', borderColor: 'rgba(239, 68, 68, 0.2)' }}
                    onClick={handlePurge}
                    disabled={purging}
                  >
                    {purging ? 'Purging...' : 'Delete All Files'}
                  </button>
                </div>

                <div style={{ marginTop: 24, paddingTop: 24, borderTop: '1px solid rgba(239, 68, 68, 0.1)' }}>
                  <button 
                    className="btn btn-ghost btn-sm" 
                    style={{ color: 'var(--s-rejected)', borderColor: 'rgba(239, 68, 68, 0.2)', width: '100%', justifyContent: 'center' }}
                    onClick={() => setShowDeleteModal(true)}
                  >
                    <Trash2 size={12} /> Delete Project Permanently
                  </button>
                </div>
                
                <div style={{ marginTop: 40, textAlign: 'center', opacity: 0.2, fontSize: 9, fontFamily: 'monospace' }}>
                  DEBUG ID: {project?.id}
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      {/* ── Delete Modal ─────────────────────────────────────── */}
      {showDeleteModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(8px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 10000, padding: 20
        }}>
          <div className="card-glow" style={{ 
            maxWidth: 400, width: '100%', background: 'var(--bg-card)', 
            border: '1px solid rgba(239, 68, 68, 0.3)', padding: 32, borderRadius: 16
          }}>
            <div style={{ color: 'var(--s-rejected)', marginBottom: 16 }}>
              <AlertTriangle size={48} strokeWidth={1.5} />
            </div>
            <h2 style={{ fontSize: 20, fontWeight: 900, color: 'var(--text)', marginBottom: 12 }}>
              Extreme Warning
            </h2>
            <p style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.6, marginBottom: 24 }}>
              This will <strong style={{ color: 'var(--s-rejected)' }}>PERMANENTLY DELETE</strong> the entire project, all spec sections, and all submittal data. This action cannot be reversed.
            </p>
            
            <div className="form-group" style={{ marginBottom: 24 }}>
              <label className="form-label" style={{ color: 'var(--s-rejected)', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1 }}>
                Type <span style={{ color: 'var(--text)' }}>DELETE</span> to confirm
              </label>
              <input 
                className="form-input"
                style={{ 
                  textAlign: 'center', fontSize: 18, fontWeight: 900, 
                  letterSpacing: 2, background: 'rgba(0,0,0,0.2)',
                  borderColor: deleteConfirmInput === 'DELETE' ? 'var(--s-rejected)' : 'var(--border)'
                }}
                placeholder="---"
                value={deleteConfirmInput}
                onChange={e => setDeleteConfirmInput(e.target.value.toUpperCase())}
                autoFocus
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <button 
                className="btn btn-ghost" 
                onClick={() => { setShowDeleteModal(false); setDeleteConfirmInput('') }}
                disabled={isDeleting}
              >
                Cancel
              </button>
              <button 
                className="btn btn-primary"
                style={{ background: 'var(--s-rejected)', color: 'white', border: 'none' }}
                onClick={handleDeleteProject}
                disabled={deleteConfirmInput !== 'DELETE' || isDeleting}
              >
                {isDeleting ? 'Deleting...' : 'Delete Forever'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
