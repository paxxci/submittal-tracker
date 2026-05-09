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

  // 2. Get project membership counts for this org
  const { data: members, error: mError } = await supabase
    .from('project_members')
    .select('email, role, project_id, projects!inner(organization_id)')
    .eq('projects.organization_id', organizationId)

  // 3. Get all organization-level invites (pending + active)
  const { data: invites, error: iError } = await supabase
    .from('organization_invites')
    .select('*')
    .eq('organization_id', organizationId)

  if (pError || mError || iError) throw pError || mError || iError

  const roster = {}

  // Step 1: seed roster from invites (captures pending members not yet signed up)
  ;(invites || []).forEach(i => {
    const email = i.email?.toLowerCase().trim()
    if (!email) return
    roster[email] = {
      email,
      full_name: '',
      is_global_staff: i.is_portfolio_access,
      projects_count: 0,
      is_pending: true,
      roles: [i.role]
    }
  })

  // Step 2: overlay signed-up profiles (org_id already scoped, so these are all valid members)
  ;(profiles || []).forEach(p => {
    const email = p.email?.toLowerCase().trim()
    if (!email) return
    if (roster[email]) {
      roster[email] = { ...roster[email], ...p, is_pending: false }
    } else {
      roster[email] = { ...p, email, projects_count: 0, is_pending: false, roles: [] }
    }
  })

  // Step 3: add project membership counts
  ;(members || []).forEach(m => {
    const email = m.email?.toLowerCase().trim()
    if (!email || !roster[email]) return
    roster[email].projects_count = (roster[email].projects_count || 0) + 1
    if (!roster[email].roles?.includes(m.role)) {
      roster[email].roles = [...(roster[email].roles || []), m.role]
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

export const toggleProjectAccess = async (projectId, email, role = 'editor', grant = true, membershipId = null, organizationId = null) => {
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
    .upsert({ 
      project_id: projectId, 
      email: cleanEmail, 
      role,
      organization_id: organizationId 
    }, { onConflict: 'project_id,email' })
  if (error) throw error
}

/**
 * REMOVE TEAM MEMBER (Full Offboarding)
 * Wipes someone completely from the organization:
 * 1. Looks up all project IDs for this org, then removes their project_members rows
 * 2. Deletes their organization_invites record
 * 3. Clears organization_id from their profile (best-effort, may be blocked by RLS)
 */
export const removeTeamMember = async (email, organizationId) => {
  const cleanEmail = email?.toLowerCase().trim()

  // 1. Get all project IDs in this org, then remove from project_members by project_id.
  //    We cannot rely on project_members.organization_id because older rows may not have it set.
  const { data: orgProjects } = await supabase
    .from('projects')
    .select('id')
    .eq('organization_id', organizationId)

  const projectIds = orgProjects?.map(p => p.id) || []

  if (projectIds.length > 0) {
    const { error: memberError } = await supabase
      .from('project_members')
      .delete()
      .ilike('email', cleanEmail)   // case-insensitive match
      .in('project_id', projectIds)

    if (memberError) throw memberError
  }

  // 2. Remove the island-level invite (case-insensitive)
  const { data: inviteRows } = await supabase
    .from('organization_invites')
    .select('id')
    .ilike('email', cleanEmail)
    .eq('organization_id', organizationId)

  if (inviteRows?.length) {
    const { error: inviteError } = await supabase
      .from('organization_invites')
      .delete()
      .in('id', inviteRows.map(r => r.id))

    if (inviteError) throw inviteError
  }

  // 3. Detach profile via SECURITY DEFINER RPC (bypasses RLS so this always works)
  const { error: rpcError } = await supabase.rpc('remove_member_from_org', { member_email: cleanEmail })
  if (rpcError) {
    console.warn('Profile detach via RPC failed:', rpcError.message)
    // Non-fatal — invites + project_members are already cleaned up
  }
}
