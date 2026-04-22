import React, { useState, useEffect } from 'react'
import { Users, Shield, ShieldCheck, Lock, Search, ChevronRight, Folder as ProjectIcon } from 'lucide-react'
import { getTeamProfiles, updateGlobalAccess, getUserMemberships, toggleProjectAccess, createOrganizationInvite } from '../services/team_service'
import ProjectSearchableDropdown from '../components/ProjectSearchableDropdown'

export default function TeamView({ activeUser, projects: appProjects = [], organization }) {
  const [profiles, setProfiles] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [selectedMember, setSelectedMember] = useState(null)
  
  // Memberships for the selected user
  const [memberApps, setMemberApps] = useState([])
  const [updating, setUpdating] = useState(null)
  
  // Invite Modal State
  const [showInvite, setShowInvite] = useState(false)
  const [inviteForm, setInviteForm] = useState({ name: '', email: '', isGlobal: false, projectIds: [], role: 'editor' })
  const [inviteSuccess, setInviteSuccess] = useState(false)
  const [inviteError, setInviteError] = useState(null)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      setLoading(true)
      const pData = await getTeamProfiles(organization?.id)
      setProfiles(pData || [])
    } catch (err) {
      console.error('Failed to load team profiles:', err)
      setProfiles([])
    } finally {
      setLoading(false)
    }
  }

  const handleToggleGlobal = async (profile, currentVal) => {
    try {
      setUpdating(profile.id)
      await updateGlobalAccess(profile.id, !currentVal)
      setProfiles(prev => prev.map(p => p.id === profile.id ? { ...p, is_global_staff: !currentVal } : p))
    } catch (err) {
      console.error('Toggle failed:', err)
    } finally {
      setUpdating(null)
    }
  }

  const openMemberDetail = async (member) => {
    try {
      setSelectedMember(member)
      const memberships = await getUserMemberships(member.email)
      setMemberApps(memberships || [])
    } catch (err) {
      console.error('Failed to load memberships:', err)
      setMemberApps([])
    }
  }

  const handleToggleProject = async (projId) => {
    if (!selectedMember) return
    const hasAccess = memberApps.some(m => m.project_id === projId)
    try {
      setUpdating(projId)
      await toggleProjectAccess(projId, selectedMember.email, 'editor', !hasAccess)
      
      // Update local state
      if (hasAccess) {
        setMemberApps(prev => prev.filter(m => m.project_id !== projId))
      } else {
        const proj = appProjects.find(p => p.id === projId)
        setMemberApps(prev => [...prev, { project_id: projId, projects: proj, role: 'editor' }])
      }
    } catch (err) {
      console.error('Project toggle failed:', err)
    } finally {
      setUpdating(null)
    }
  }

  const handleSendInvite = async () => {
    if (!inviteForm.email) return
    try {
      setUpdating('invite')
      
      // 1. Create Organization-level invite (The "Island" invite)
      await createOrganizationInvite({
        email: inviteForm.email,
        organizationId: organization.id,
        isPortfolioAccess: inviteForm.isGlobal,
        role: inviteForm.role
      })

      // 2. Add to specific projects (if any)
      if (inviteForm.projectIds.length > 0) {
        await Promise.all(inviteForm.projectIds.map(pid => 
          toggleProjectAccess(pid, inviteForm.email, inviteForm.role, true)
        ))
      }
      
      setInviteSuccess(true)
      setTimeout(() => {
        setShowInvite(false)
        setInviteSuccess(false)
        setInviteForm({ name: '', email: '', isGlobal: false, projectIds: [], role: 'editor' })
        loadData()
      }, 2000)
    } catch (err) {
      console.error('Invite failed:', err)
      setInviteError(err.message || 'An unexpected error occurred while granting access.')
    } finally {
      setUpdating(null)
    }
  }

  const teamFiltered = (profiles || []).filter(p => 
    p && (
      p.email?.toLowerCase().includes(search.toLowerCase()) || 
      p.full_name?.toLowerCase().includes(search.toLowerCase())
    )
  )

  return (
    <div className="view-container">
      <div className="top-bar">
        <span className="top-bar-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Users size={16} color="var(--accent)" /> Team Management
        </span>
        <div style={{ flex: 1 }} />
        <div className="search-wrap" style={{ minWidth: 240 }}>
          <Search size={14} color="var(--text-muted)" />
          <input 
            placeholder="Search team..." 
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
      </div>

      <div className="stage-body" style={{ padding: '40px' }}>
        <div style={{ maxWidth: 1000, margin: '0 auto' }}>
          
          <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 32 }}>
            <div>
              <h1 style={{ fontSize: 32, fontWeight: 900, marginBottom: 8, letterSpacing: '-1px' }}>Team Management</h1>
              <div style={{ display: 'flex', gap: 16 }}>
                <div style={{ fontSize: 13, color: 'var(--text-sub)' }}>
                  <strong style={{ color: 'var(--accent)' }}>{profiles.length}</strong> Total Members
                </div>
                <div style={{ fontSize: 13, color: 'var(--text-sub)' }}>
                  <strong style={{ color: 'var(--s-approved)' }}>{profiles.filter(p => p?.is_global_staff).length}</strong> Global Staff
                </div>
              </div>
            </div>
            <button className="btn btn-primary" onClick={() => { setInviteSuccess(false); setInviteError(null); setShowInvite(true) }} style={{ padding: '12px 24px', fontSize: 14 }}>
              <Users size={18} /> Add Team Member
            </button>
          </div>

          {loading ? (
             <div style={{ padding: 100, textAlign: 'center', color: 'var(--text-muted)' }}>
                <div className="ai-shimmer" style={{ height: 200, borderRadius: 20, background: 'var(--bg-surface)' }} />
             </div>
          ) : teamFiltered.length === 0 ? (
            <div className="card" style={{ padding: 80, textAlign: 'center', borderStyle: 'dashed', background: 'transparent' }}>
              <div style={{ 
                width: 80, height: 80, borderRadius: '50%', background: 'var(--bg-surface)', 
                display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px',
                border: '2px solid var(--border)'
              }}>
                <Users size={32} color="var(--text-muted)" />
              </div>
              <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 8 }}>Build your team</h2>
              <p style={{ color: 'var(--text-muted)', marginBottom: 32, maxWidth: 400, margin: '0 auto 32px' }}>
                You haven't added any employees or partners yet. Start by inviting your first team member.
              </p>
              <button className="btn btn-primary" onClick={() => { setInviteSuccess(false); setShowInvite(true) }} style={{ padding: '14px 28px' }}>
                 Get Started
              </button>
            </div>
          ) : (
            <div className="card" style={{ overflow: 'hidden' }}>
              <table className="submittal-table">
                <thead>
                  <tr>
                    <th>Member Identity</th>
                    <th>Managed Scope</th>
                    <th>Permissions</th>
                    <th style={{ textAlign: 'right' }}>Management</th>
                  </tr>
                </thead>
                <tbody>
                  {teamFiltered.map(p => (
                    <tr key={p?.id || p?.email || Math.random()} onClick={() => openMemberDetail(p)} style={{ height: 64 }}>
                      <td style={{ fontWeight: 700, fontSize: 14, color: 'var(--text)' }}>
                         <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            {p.full_name || p.email?.split('@')[0] || 'Unknown User'}
                            {p.is_pending && <span style={{ fontSize: 9, background: 'var(--bg-elevated)', color: 'var(--text-muted)', padding: '2px 6px', borderRadius: 4, letterSpacing: 0.5 }}>PENDING</span>}
                         </div>
                      </td>
                      <td style={{ color: 'var(--text-sub)', fontSize: 13 }}>
                         {p.projects_count || 0} {p.projects_count === 1 ? 'Project' : 'Projects'} 
                      </td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          {p.is_global_staff ? (
                            <span className="badge badge-approved" style={{ padding: '4px 12px' }}>
                              <ShieldCheck size={12} /> Global Staff
                            </span>
                          ) : (
                            <span className="badge badge-not_started" style={{ padding: '4px 12px' }}>
                              <Lock size={12} /> {p.is_pending ? 'Invited' : 'Restricted'}
                            </span>
                          ) }
                        </div>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <button className="btn btn-ghost btn-sm">
                           Manage Access <ChevronRight size={14} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Slide-Over Panel for Member Detail */}
      {selectedMember && (
        <div className="modal-backdrop animate-in" style={{ zIndex: 1100, justifyContent: 'flex-end', padding: 0 }} onClick={() => setSelectedMember(null)}>
          <div 
            className="slide-in-right" 
            style={{ 
              width: 440, height: '100%', background: 'var(--bg-surface)', borderLeft: '1px solid var(--border)',
              display: 'flex', flexDirection: 'column', boxSharp: 'var(--shadow-lg)'
            }}
            onClick={e => e.stopPropagation()}
          >
            <div style={{ padding: 32, borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 style={{ fontSize: 20, fontWeight: 900 }}>Member Profile</h2>
              <button className="btn-icon" onClick={() => setSelectedMember(null)}>✕</button>
            </div>

            <div style={{ flex: 1, overflowY: 'auto', padding: 32 }}>
              <div style={{ textAlign: 'center', marginBottom: 40 }}>
                <div style={{ 
                  width: 80, height: 80, borderRadius: '50%', background: 'var(--accent-dim)', 
                  display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px',
                  border: '2px solid var(--accent)'
                }}>
                  <Users size={32} color="var(--accent)" />
                </div>
                <h3 style={{ fontSize: 22, fontWeight: 900 }}>{selectedMember.full_name || 'Team Member'}</h3>
                <p style={{ color: 'var(--text-muted)' }}>{selectedMember.email}</p>
              </div>

              <div style={{ marginBottom: 40 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
                  <ShieldCheck size={16} color="var(--accent)" />
                  <span style={{ fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: 1.5 }}>Authority Level</span>
                </div>
                
                <div className="card-glow" style={{ 
                  padding: 24, borderRadius: 16, border: '1px solid',
                  borderColor: selectedMember.is_global_staff ? 'var(--accent)' : 'var(--border)',
                  background: selectedMember.is_global_staff ? 'var(--accent-dim)' : 'var(--bg-elevated)'
                }}>
                   <div style={{ fontWeight: 800, fontSize: 16, marginBottom: 4, color: selectedMember.is_global_staff ? 'var(--accent)' : 'var(--text)' }}>
                     {selectedMember.is_global_staff ? 'Global Portfolio Access' : 'Restricted Access'}
                   </div>
                   <p style={{ fontSize: 12, color: 'var(--text-sub)', lineHeight: 1.5, marginBottom: 20 }}>
                     {selectedMember.is_global_staff 
                       ? 'This user has the "Master Key" and can view all current and future projects automatically.' 
                       : 'This user can only see specific projects you manually assign to them below.'}
                   </p>
                   <button 
                    className={`btn ${selectedMember.is_global_staff ? 'btn-danger' : 'btn-primary'} w-full`}
                    style={{ width: '100%', justifyContent: 'center' }}
                    onClick={() => handleToggleGlobal(selectedMember, selectedMember.is_global_staff)}
                    disabled={updating === selectedMember.id || selectedMember.is_pending}
                   >
                     {selectedMember.is_pending ? 'Member Registration Required' : selectedMember.is_global_staff ? 'Revoke Global Access' : 'Grant Global Access'}
                   </button>
                </div>
              </div>

              {!selectedMember.is_global_staff && (
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
                    <ProjectIcon size={16} color="var(--text-sub)" />
                    <span style={{ fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: 1.5 }}>Project Assignments</span>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {(appProjects || []).map(proj => {
                      const hasAccess = (memberApps || []).some(m => m.project_id === proj.id)
                      return (
                        <div 
                          key={proj.id} 
                          className="card"
                          style={{ 
                            display: 'flex', alignItems: 'center', justifyContent: 'space-between', 
                            padding: '16px', background: 'var(--bg-elevated)', border: hasAccess ? '1px solid var(--accent)' : '1px solid var(--border)'
                          }}
                        >
                          <div>
                            <div style={{ fontSize: 13, fontWeight: 700 }}>{proj.name}</div>
                            <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>{proj.number}</div>
                          </div>
                          <button 
                            className={`btn ${hasAccess ? 'btn-danger' : 'btn-ghost'} btn-sm`}
                            onClick={() => handleToggleProject(proj.id)}
                            disabled={updating === proj.id}
                          >
                            {hasAccess ? 'Revoke' : 'Grant'}
                          </button>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Invite Modal */}
      {showInvite && (
        <div className="modal-backdrop animate-in" style={{ zIndex: 1000 }}>
          <div className="modal" style={{ maxWidth: 500, padding: 32, textAlign: inviteSuccess ? 'center' : 'left' }}>
            {inviteSuccess ? (
              <div className="animate-in" style={{ padding: '40px 0' }}>
                 <div style={{ width: 64, height: 64, background: 'var(--s-approved)', color: '#000', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px', boxShadow: '0 0 30px rgba(16, 185, 129, 0.4)' }}>
                    <ShieldCheck size={32} />
                 </div>
                 <h2 style={{ fontSize: 24, fontWeight: 900, marginBottom: 8 }}>Permissions Granted</h2>
                 <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>
                    Access has been established for <br/>
                    <strong style={{ color: 'var(--text)' }}>{inviteForm.email}</strong>
                 </p>
              </div>
            ) : (
              <>
                <h2 style={{ fontSize: 24, fontWeight: 900, marginBottom: 8 }}>Add Team Member</h2>
                <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 24 }}>
                  Grant project access to an internal employee or external vendor.
                </p>

                {inviteError && (
                  <div className="animate-in" style={{ 
                    padding: '12px 16px', borderRadius: 8, background: 'rgba(239, 68, 68, 0.1)', 
                    color: '#ef4444', fontSize: 12, marginBottom: 24, border: '1px solid rgba(239, 68, 68, 0.2)',
                    display: 'flex', alignItems: 'center', gap: 10
                  }}>
                    <Shield size={16} /> {inviteError}
                  </div>
                )}

                <div className="form-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 24 }}>
                  <div className="form-group">
                    <label style={{ display: 'block', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', marginBottom: 8, color: 'var(--text-muted)' }}>Full Name</label>
                    <input 
                      className="card" 
                      style={{ width: '100%', padding: '12px', background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text)' }}
                      placeholder="e.g. John Smith"
                      value={inviteForm.name}
                      onChange={e => setInviteForm(f => ({ ...f, name: e.target.value }))}
                    />
                  </div>
                  <div className="form-group">
                    <label style={{ display: 'block', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', marginBottom: 8, color: 'var(--text-muted)' }}>Email Address</label>
                    <input 
                      className="card" 
                      style={{ width: '100%', padding: '12px', background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text)' }}
                      placeholder="name@company.com"
                      value={inviteForm.email}
                      onChange={e => setInviteForm(f => ({ ...f, email: e.target.value }))}
                    />
                  </div>
                </div>

                <div style={{ marginBottom: 24 }}>
                    <label style={{ display: 'block', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', marginBottom: 12, color: 'var(--text-muted)' }}>Authority Level</label>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
                      {['viewer', 'editor', 'admin'].map(r => (
                        <button 
                          key={r}
                          type="button"
                          onClick={() => setInviteForm(f => ({ ...f, role: r }))}
                          className={`btn btn-sm ${inviteForm.role === r ? 'btn-primary' : 'btn-ghost'}`}
                          style={{ textTransform: 'capitalize', fontSize: 12, padding: '10px' }}
                        >
                          {r}
                        </button>
                      ))}
                    </div>
                </div>

                <div style={{ marginBottom: 24 }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 12, padding: 16, borderRadius: 12, background: 'var(--bg-elevated)', border: '1px solid var(--border)', cursor: 'pointer' }}>
                      <input 
                        type="checkbox" 
                        checked={inviteForm.isGlobal}
                        onChange={e => setInviteForm(f => ({ ...f, isGlobal: e.target.checked }))}
                        style={{ width: 18, height: 18, accentColor: 'var(--accent)' }}
                      />
                      <div>
                        <div style={{ fontWeight: 700, fontSize: 13 }}>Global Portfolio Access (Master Key)</div>
                        <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>User will see all projects automatically.</div>
                      </div>
                  </label>
                </div>

                <div style={{ marginBottom: 24 }}>
                  <label style={{ display: 'block', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', marginBottom: 12, color: 'var(--text-muted)' }}>
                    Assign to Projects
                  </label>
                  
                  <ProjectSearchableDropdown 
                    projects={appProjects}
                    selected={inviteForm.projectIds}
                    role={inviteForm.role}
                    onChange={ids => setInviteForm(f => ({ ...f, projectIds: ids }))}
                  />
                </div>

                <div style={{ display: 'flex', gap: 12, borderTop: '1px solid var(--border)', paddingTop: 24 }}>
                  <button className="btn btn-ghost" style={{ flex: 1 }} onClick={() => setShowInvite(false)}>Cancel</button>
                  <button 
                    className="btn btn-primary" 
                    style={{ flex: 1.5 }} 
                    onClick={handleSendInvite}
                    disabled={!inviteForm.email || updating === 'invite'}
                  >
                    {updating === 'invite' ? 'Granting Access...' : 'Set Permissions'}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
