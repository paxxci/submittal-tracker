import { supabase } from '../supabase_client'

export const getProjectMembers = async (projectId) => {
  const { data, error } = await supabase
    .from('project_members')
    .select('*')
    .eq('project_id', projectId)
    .order('created_at', { ascending: true })
  if (error) throw error
  return data
}

export const addProjectMember = async (projectId, email, role = 'editor', name = '', organizationId = null) => {
  const cleanEmail = email?.toLowerCase().trim()

  // 1. Add to project_members
  const { data, error } = await supabase
    .from('project_members')
    .insert([{ project_id: projectId, email: cleanEmail, role, name, organization_id: organizationId }])
    .select()
    .single()
  if (error) throw error

  // 2. CRITICAL: Also write to organization_invites so signup can find them
  // This is what the check_invitation RPC queries — without this, the
  // signup page thinks they're a stranger and demands a license key.
  if (organizationId) {
    await supabase
      .from('organization_invites')
      .upsert([{
        email: cleanEmail,
        organization_id: organizationId,
        is_portfolio_access: false,
        role
      }], { onConflict: 'organization_id,email' })
    // We intentionally swallow errors here — if it fails, the
    // member was still added to the project successfully.
  }

  return data
}

export const removeProjectMember = async (id) => {
  const { error } = await supabase.from('project_members').delete().eq('id', id)
  if (error) throw error
}
