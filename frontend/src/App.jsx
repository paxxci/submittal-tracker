import React, { useState, useEffect } from 'react'
import NavRail from './components/NavRail'
import Dashboard from './views/Dashboard'
import ProjectView from './views/ProjectView'
import SpecView from './views/SpecView'
import Settings from './views/Settings'
import AccountSecurity from './views/AccountSecurity'
import TeamView from './views/TeamView'
import Login from './views/Login'
import { getProjects } from './services/project_service'
import { getOrganizationForUser, createOrganization } from './services/organization_service'
import { supabase } from './supabase_client'

export default function App() {
  const [session, setSession] = useState(null)
  const [isLoaded, setIsLoaded] = useState(false)
  const [view, setViewInternal] = useState(localStorage.getItem('sa-active-view') || 'dashboard')

  // URL Self-Healing (Prevents white screens if user is at /login or other ghost paths)
  useEffect(() => {
    if (window.location.pathname !== '/') {
      window.history.replaceState(null, '', '/')
    }
  }, [])
  const [projects, setProjects] = useState([])
  const [currentProject, setCurrentProject] = useState(null)
  const [userProfile, setUserProfile] = useState(null)
  const [organization, setOrganization] = useState(null)
  const [loading, setLoading] = useState(false)
  const [showArchived, setShowArchived] = useState(false)
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false)

  const setView = (v) => {
    localStorage.setItem('sa-active-view', v)
    setViewInternal(v)
  }

  useEffect(() => {
    const isTestMode = localStorage.getItem('sb-test-mode') === 'true'
    if (isTestMode) {
      setSession({
        user: { id: 'test-user-id', email: 'test@example.com', user_metadata: { full_name: 'Test Administrator' } }
      })
      setIsLoaded(true)
      return
    }

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setIsLoaded(true)
    })
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
      setIsLoaded(true)
    })
    return () => subscription.unsubscribe()
  }, [])

  useEffect(() => {
    if (session) {
      const isTestMode = typeof window !== 'undefined' && localStorage.getItem('sb-test-mode') === 'true'

      if (isTestMode) {
        setUserProfile({ id: session.user.id, is_global_staff: true })
        setOrganization({ id: 'test-org-id', name: 'Audit Test Org' })
      } else {
        // 1. Load Profile
        supabase.from('profiles').select('*').eq('id', session.user.id).maybeSingle()
          .then(async ({ data }) => {
            const profile = data || { id: session.user.id }
            setUserProfile(profile)

            // 2. Load or Create Organization
            try {
              let org = await getOrganizationForUser(session.user.id)

              if (!org) {
                // Check for a pending invitation
                const { data: invite } = await supabase
                  .from('organization_invites')
                  .select('*')
                  .ilike('email', session.user.email) // ILIKE is case-insensitive
                  .maybeSingle()

                if (invite) {
                  // 1. Create the Profile for the guest
                  const { data: newProfile, error: profileErr } = await supabase.from('profiles').upsert({
                    id: session.user.id,
                    email: session.user.email,
                    organization_id: invite.organization_id,
                    is_global_staff: invite.is_portfolio_access
                  }).select().single()

                  if (profileErr) throw profileErr

                  // 2. Refresh Local State immediately
                  setUserProfile(newProfile)

                  // 3. Link to Organization
                  const { data: orgData } = await supabase.from('organizations').select('*').eq('id', invite.organization_id).single()
                  org = orgData

                  // 4. Clean up invite
                  await supabase.from('organization_invites').delete().eq('id', invite.id)
                } else {
                  // Create a NEW Island (New customer)
                  org = await createOrganization(`${session.user.email.split('@')[0]}'s Island`, session.user.id)

                  // UPSERT PROFILE (Create if missing)
                  const { data: newProfile, error: profileErr } = await supabase.from('profiles').upsert({
                    id: session.user.id,
                    email: session.user.email,
                    organization_id: org.id,
                    is_global_staff: true, // The island creator is always the admin
                    signup_code: session.user.user_metadata?.signup_code // Store here for secure RLS
                  }).select().single()

                  if (profileErr) throw profileErr
                  setUserProfile(newProfile)

                }
              }
              setOrganization(org)

              // BURN THE KEY (Mark as redeemed if it hasn't been yet)
              const usedCode = session.user.user_metadata?.signup_code
              if (usedCode) {
                await supabase.from('onboarding_keys').update({
                  is_redeemed: true,
                  redeemed_at: new Date().toISOString(),
                  redeemed_by: session.user.id
                }).eq('key_code', usedCode.toUpperCase()).eq('is_redeemed', false)
              }
            } catch (err) {
              console.error('Organization sync failed:', err)
            }
          })
      }
    }
  }, [session])

  const loadProjects = async () => {
    const isTestMode = localStorage.getItem('sb-test-mode') === 'true'
    if (isTestMode) {
      setProjects([{
        id: '00000000-0000-0000-0000-000000000000',
        name: 'Audit Test Project',
        number: 'PEC-2024-001',
        client: 'Test Client',
        is_archived: false,
        created_at: new Date().toISOString(),
        project_members: [{ email: 'test@example.com', role: 'admin' }]
      }])
      return
    }

    if (!session) return
    setLoading(true)
    try {
      const data = await getProjects(showArchived)
      setProjects(data || [])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (session) loadProjects()
  }, [session, showArchived])

  // Restore active project from memory
  useEffect(() => {
    const savedPid = localStorage.getItem('sa-active-project-id')
    if (projects.length > 0 && savedPid && !currentProject) {
      const p = projects.find(proj => proj.id === savedPid)
      if (p) setCurrentProject(p)
    }
  }, [projects])

  const openProject = (p) => {
    localStorage.setItem('sa-active-project-id', p.id)
    setCurrentProject(p)
    setView('project')
  }

  const goToDashboard = () => {
    localStorage.removeItem('sa-active-project-id')
    setCurrentProject(null)
    setView('dashboard')
  }

  if (!isLoaded) return <div style={{ background: '#0a0a0a', height: '100vh' }} />
  if (!session) return <Login onComplete={() => { localStorage.setItem('sa-active-view', 'dashboard'); window.location.reload() }} />

  const isGlobalAdmin = userProfile?.is_global_staff === true
  const explicitRole = currentProject?.project_members?.find(m => m.email === session.user.email)?.role
  const activeUserRole = isGlobalAdmin ? 'admin' : (explicitRole || 'viewer')

  return (
    <div className="app-shell">
      <NavRail
        view={view}
        setView={setView}
        currentProject={currentProject}
        goToDashboard={goToDashboard}
        userEmail={session.user.email}
        onLogoutRequest={() => setShowLogoutConfirm(true)}
        activeUserRole={activeUserRole}
        userProfile={userProfile}
        isGlobalAdmin={isGlobalAdmin}
        organization={organization}
      />

      <div className="main-stage">
        {view === 'dashboard' && (
          <Dashboard
            projects={projects}
            loading={loading}
            onOpenProject={openProject}
            onProjectsChange={loadProjects}
            showArchived={showArchived}
            setShowArchived={setShowArchived}
            userEmail={session.user.email}
            organization={organization}
            isGlobalAdmin={isGlobalAdmin}
          />
        )}

        {view === 'project' && currentProject && (
          <ProjectView
            project={currentProject}
            activeUser={session.user}
            onBack={goToDashboard}
            onSpecIntel={() => setView('spec')}
            activeUserRole={activeUserRole}
          />
        )}

        {view === 'spec' && currentProject && (
          <SpecView
            project={currentProject}
            activeUser={session.user.email}
            onBack={() => setView('project')}
          />
        )}

        {view === 'team' && (
          <TeamView
            activeUser={session.user}
            projects={projects}
            organization={organization}
          />
        )}

        {view === 'settings' && currentProject && (
          <Settings
            project={currentProject}
            onProjectUpdated={loadProjects}
            activeUserRole={activeUserRole}
            organization={organization}
          />
        )}

        {view === 'security' && (
          <AccountSecurity userEmail={session.user.email} />
        )}
      </div>

      {showLogoutConfirm && (
        <div className="modal-backdrop">
          <div className="modal" style={{ maxWidth: 360, textAlign: 'center', padding: 32 }}>
            <h2 style={{ fontSize: 20, fontWeight: 800 }}>Log Out?</h2>
            <div style={{ display: 'flex', gap: 12, marginTop: 24 }}>
              <button className="btn btn-outline" style={{ flex: 1 }} onClick={() => setShowLogoutConfirm(false)}>Cancel</button>
              <button className="btn btn-danger" style={{ flex: 1 }} onClick={async () => { await supabase.auth.signOut(); localStorage.clear(); window.location.reload(); }}>Log Out</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
