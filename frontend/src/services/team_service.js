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
    ; (members || []).forEach(m => {
      const email = m.email?.toLowerCase().trim()
      if (!email) return
      if (!roster[email]) {
        roster[email] = { email, full_name: '', is_global_staff: false, projects_count: 0, is_pending: true, roles: [] }
      }
      roster[email].projects_count++
      if (!roster[email].roles.includes(m.role)) roster[email].roles.push(m.role)
    })

    // Add organization invites
    ; (invites || []).forEach(i => {
      const email = i.email?.toLowerCase().trim()
      if (!email) return
      if (!roster[email]) {
        roster[email] = { email, full_name: '', is_global_staff: i.is_portfolio_access, projects_count: 0, is_pending: true, roles: [i.role] }
      } else {
        roster[email].is_global_staff = roster[email].is_global_staff || i.is_portfolio_access
      }
    })

    // Overlay profile data
    ; (profiles || []).forEach(p => {
      const email = p.email?.toLowerCase().trim()
      if (!email) return
      if (roster[email]) {
        roster[email] = { ...roster[email], ...p, is_pending: false }
      } else {
        roster[email] = { ...p, email, projects_count: 0, is_pending: false, roles: [] }
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
  const cleanEmail = email?.toLowerCase().trim()
  const { data, error } = await supabase
    .from('project_members')
    .select('*, projects(*)')
    .eq('email', cleanEmail)
  if (error) throw error
  return data
}

export const toggleProjectAccess = async (projectId, email, role = 'editor', grant = true, membershipId = null) => {
  const cleanEmail = email?.toLowerCase().trim()
  if (!grant) {
    if (!membershipId) {
      // Fallback to match if ID isn't provided (backwards compatibility)
      const { error } = await supabase
        .from('project_members')
        .delete()
        .match({ project_id: projectId, email: cleanEmail })
      if (error) throw error
      return
    }

    const { error } = await supabase
      .from('project_members')
      .delete()
      .eq('id', membershipId)
    if (error) throw error
    return
  }

  const { error } = await supabase
    .from('project_members')
    .upsert({ project_id: projectId, email: cleanEmail, role }, { onConflict: 'project_id,email' })
  if (error) throw error
}
