import { supabase } from '../supabase_client'

let mockProjects = null;

export const getProjects = async (includeArchived = false) => {
  const isTestMode = typeof window !== 'undefined' && localStorage.getItem('sb-test-mode') === 'true'
  if (isTestMode) {
    if (!mockProjects) {
      mockProjects = [{
        id: '00000000-0000-0000-0000-000000000000',
        name: 'Audit Test Project',
        number: 'PEC-2024-001',
        client: 'Internal Audit',
        is_archived: false,
        created_at: new Date().toISOString(),
        project_members: [{ email: 'test@example.com', role: 'admin' }]
      }]
    }
    return [...mockProjects]
  }

  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return []

    // 1. Simple fetch: Get everything if Admin, or where I am a member
    const { data: profile } = await supabase
      .from('profiles')
      .select('is_global_staff, organization_id')
      .eq('id', user.id)
      .maybeSingle()

    const isGlobal = profile?.is_global_staff === true
    const orgId = profile?.organization_id

    let query = supabase.from('projects').select('*, project_members(email, role)')

    // 1.5. Safety Net: Enforce Island Isolation on the frontend just in case RLS is turned off!
    if (orgId) {
      query = query.eq('organization_id', orgId)
    }

    if (!isGlobal) {
      // If NOT admin, only show membership matches
      // We use a separate query or join depending on preference, 
      // but let's keep it very simple for stability.
      const { data: memberProjects } = await supabase
        .from('project_members')
        .select('project_id')
        .eq('email', user.email)

      const ids = memberProjects?.map(m => m.project_id) || []
      if (ids.length === 0) return []
      query = query.in('id', ids)
    }

    if (!includeArchived) {
      query = query.eq('is_archived', false)
    }

    const { data, error } = await query.order('created_at', { ascending: false })
    if (error) throw error

    return data || []
  } catch (err) {
    console.error('getProjects error:', err)
    return []
  }
}

export const createProject = async ({ name, number, client, address, organizationId }) => {
  if (typeof window !== 'undefined' && localStorage.getItem('sb-test-mode') === 'true') {
    const newProj = {
      id: 'test-proj-' + Date.now(),
      name, number, client, address, organization_id: organizationId,
      created_at: new Date().toISOString(),
      project_members: [{ email: 'test@example.com', role: 'admin' }]
    }
    if (mockProjects) mockProjects.push(newProj)
    else mockProjects = [newProj]
    return newProj
  }

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Authorization required')

  const { data, error } = await supabase
    .from('projects')
    .insert([{ name, number, client, address, organization_id: organizationId }])
    .select()
    .single()
  if (error) throw error

  await supabase.from('project_members').insert([
    { project_id: data.id, email: user.email, role: 'admin' }
  ])

  return data
}

export const updateProject = async (id, specs) => {
  const { data, error } = await supabase
    .from('projects')
    .update(specs)
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  return data
}

export const deleteProject = async (id) => {
  const { error } = await supabase.from('projects').delete().eq('id', id)
  if (error) throw error
}

export const archiveProject = async (id) => {
  const { data, error } = await supabase
    .from('projects')
    .update({ is_archived: true, archived_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  return data
}

export const restoreProject = async (id) => {
  const { data, error } = await supabase
    .from('projects')
    .update({ is_archived: false, archived_at: null })
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  return data
}

export const purgeProjectFiles = async (projectId) => {
  const { data: subs } = await supabase.from('submittals').select('id').eq('project_id', projectId)
  if (!subs?.length) return
  const subIds = subs.map(s => s.id)
  const { data: atts } = await supabase.from('attachments').select('id, file_url').in('submittal_id', subIds)
  if (!atts?.length) return

  const paths = atts.map(a => a.file_url.split('/attachments/')[1]).filter(Boolean)
  if (paths.length) {
    await supabase.storage.from('attachments').remove(paths)
  }
  await supabase.from('attachments').delete().in('id', atts.map(a => a.id))
}
export const purgeProjectArchive = async (projectId) => {
  // 1. Get all submittals for the project
  const { data: subs } = await supabase.from('submittals').select('id').eq('project_id', projectId)
  if (!subs?.length) return

  const subIds = subs.map(s => s.id)

  // 2. Get all attachments that are NOT marked as 'is_approved_version'
  const { data: atts } = await supabase
    .from('attachments')
    .select('id, file_url')
    .in('submittal_id', subIds)
    .eq('is_approved_version', false)

  if (!atts?.length) return

  // 3. Remove from storage
  const paths = atts.map(a => a.file_url.split('/attachments/')[1]).filter(Boolean)
  if (paths.length) {
    await supabase.storage.from('attachments').remove(paths)
  }

  // 4. Delete from database
  await supabase.from('attachments').delete().in('id', atts.map(a => a.id))
}
