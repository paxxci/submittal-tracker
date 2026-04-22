import { supabase } from '../supabase_client'

/**
 * GET TEAM PROFILES
 * Fetches unique people from both the Profiles table and Project Memberships.
 * This ensures pending invitees (who haven't signed up yet) still show up in the directory.
 */
export const getTeamProfiles = async (organizationId) => {
  if (!organizationId) return []

  // 1. Get all registered profiles in this organization
  const { data: profiles, error: pError } = await supabase
    .from('profiles')
    .select('*')
    .eq('organization_id', organizationId)

  // 2. Get all distinct emails from project_members linked to projects in this organization
  const { data: members, error: mError } = await supabase
    .from('project_members')
    .select('email, role, project_id, projects!inner(organization_id)')
    .eq('projects.organization_id', organizationId)
  
  const { data: invites, error: iError } = await supabase
    .from('organization_invites')
    .select('*')
    .eq('organization_id', organizationId)

  if (pError || mError || iError) throw pError || mError || iError

  // 4. Merge them into a unique roster
  const roster = {}
  
  // Add members first
  ;(members || []).forEach(m => {
    if (!roster[m.email]) {
      roster[m.email] = { email: m.email, full_name: '', is_global_staff: false, projects_count: 0, is_pending: true, roles: [] }
    }
    roster[m.email].projects_count++
    if (!roster[m.email].roles.includes(m.role)) roster[m.email].roles.push(m.role)
  })

  // Add organization invites
  ;(invites || []).forEach(i => {
    if (!roster[i.email]) {
      roster[i.email] = { email: i.email, full_name: '', is_global_staff: i.is_portfolio_access, projects_count: 0, is_pending: true, roles: [i.role] }
    } else {
      roster[i.email].is_global_staff = roster[i.email].is_global_staff || i.is_portfolio_access
    }
  })

  // Overlay profile data
  ;(profiles || []).forEach(p => {
    if (p.email && roster[p.email]) {
      roster[p.email] = { ...roster[p.email], ...p, is_pending: false }
    } else {
      roster[p.email] = { ...p, projects_count: 0, is_pending: false, roles: [] }
    }
  })

  return Object.values(roster).sort((a, b) => (a.email || '').localeCompare(b.email || ''))
}

export const createOrganizationInvite = async ({ email, organizationId, isPortfolioAccess, role }) => {
  const { data, error } = await supabase
    .from('organization_invites')
    .upsert([{ email, organization_id: organizationId, is_portfolio_access: isPortfolioAccess, role }], { onConflict: 'organization_id,email' })
    .select()
    .single()
  
  if (error) throw error
  return data
}

export const updateGlobalAccess = async (profileId, isGlobal) => {
  const { error } = await supabase
    .from('profiles')
    .update({ is_global_staff: isGlobal })
    .eq('id', profileId)
  if (error) throw error
}

export const getUserMemberships = async (email) => {
  const { data, error } = await supabase
    .from('project_members')
    .select('*, projects(*)')
    .eq('email', email)
  if (error) throw error
  return data
}

export const toggleProjectAccess = async (projectId, email, role = 'editor', grant = true) => {
  if (!grant) {
    const { error } = await supabase
      .from('project_members')
      .delete()
      .match({ project_id: projectId, email })
    if (error) throw error
    return
  }

  const { error } = await supabase
    .from('project_members')
    .upsert({ project_id: projectId, email, role }, { onConflict: 'project_id,email' })
  if (error) throw error
}
