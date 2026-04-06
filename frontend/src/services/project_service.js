import { supabase } from '../supabase_client'

export const getProjects = async (includeArchived = false) => {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return []

    let query = supabase
      .from('projects')
      .select('*, project_members!inner(email, role)')
      .eq('project_members.email', user.email)
      .order('created_at', { ascending: false })
    
    if (!includeArchived) {
      query = query.eq('is_archived', false)
    }

    const { data, error } = await query
    if (error) {
      // Fallback if join fails (e.g. initial setup)
      console.warn('Membership filter failed, trying primary fetch.', error)
      const { data: all } = await supabase.from('projects').select('*')
      return all || []
    }
    return data || []
  } catch (err) {
    console.error('getProjects error:', err)
    return []
  }
}

export const createProject = async ({ name, number, client, address }) => {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Authorization required')

  // 1. Create the project
  const { data, error } = await supabase
    .from('projects')
    .insert([{ name, number, client, address }])
    .select()
    .single()
  if (error) throw error

  // 2. Automatically add the creator as Admin
  await supabase.from('project_members').insert([
    { project_id: data.id, email: user.email, role: 'admin' }
  ])
  
  return data
}

export const updateProject = async (id, { name, number, client, address }) => {
  const { data, error } = await supabase
    .from('projects')
    .update({ name, number, client, address })
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
  // 1. Get all submittal IDs for this project
  const { data: subs } = await supabase.from('submittals').select('id').eq('project_id', projectId)
  if (!subs?.length) return

  const subIds = subs.map(s => s.id)

  // 2. Get all attachments for these submittals
  const { data: atts } = await supabase.from('attachments').select('id, file_url').in('submittal_id', subIds)
  if (!atts?.length) return

  // 3. Delete files from storage
  const paths = atts.map(a => a.file_url.split('/attachments/')[1]).filter(Boolean)
  if (paths.length) {
    await supabase.storage.from('attachments').remove(paths)
  }

  // 4. Delete rows from attachments table
  const { error } = await supabase.from('attachments').delete().in('id', atts.map(a => a.id))
  if (error) throw error
}

export const purgeProjectArchive = async (projectId) => {
  // Fetch submittals to get attachments
  const { data: submittals } = await supabase.from('submittals').select('id').eq('project_id', projectId)
  const subIds = submittals.map(s => s.id)
  
  if (!subIds.length) return

  // Find all non-approved attachments
  const { data: atts } = await supabase
    .from('attachments')
    .select('id, file_url')
    .in('submittal_id', subIds)
    .eq('is_approved_version', false)

  if (!atts.length) return

  // Delete from storage
  for (const a of atts) {
    const path = a.file_url.split('/attachments/')[1]
    if (path) await supabase.storage.from('attachments').remove([path])
  }

  // Delete from DB
  const { error } = await supabase.from('attachments').delete().in('id', atts.map(a => a.id))
  if (error) throw error
}
