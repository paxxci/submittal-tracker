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
      let fallbackQuery = supabase.from('projects').select('*')
      if (!includeArchived) {
        fallbackQuery = fallbackQuery.eq('is_archived', false)
      }
      const { data: all } = await fallbackQuery
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
  // 1. Cleanup children first (Submittals, Logs, Attachments)
  const { data: subs, error: subErr } = await supabase.from('submittals').select('id').eq('project_id', id)
  if (subErr) throw new Error('Failed to fetch submittals for deletion.');

  if (subs?.length) {
    const subIds = subs.map(s => s.id)
    await purgeProjectFiles(id) // Storage cleanup
    const { error: alErr } = await supabase.from('activity_log').delete().in('submittal_id', subIds)
    if (alErr) throw new Error('Failed to delete activity logs: ' + alErr.message)
    const { error: sdErr } = await supabase.from('submittals').delete().in('id', subIds)
    if (sdErr) throw new Error('Failed to delete submittals: ' + sdErr.message)
  }

  // 2. Delete contacts and spec sections
  const { error: cErr } = await supabase.from('contacts').delete().eq('project_id', id)
  if (cErr) throw new Error('Failed to delete contacts: ' + cErr.message)

  const { error: ssErr } = await supabase.from('spec_sections').delete().eq('project_id', id)
  if (ssErr) throw new Error('Failed to delete spec sections: ' + ssErr.message)

  // 3. Delete the project record FIRST (while user still has membership permissions)
  const { error: pErr } = await supabase.from('projects').delete().eq('id', id)
  if (pErr) throw new Error('Failed to delete project: ' + pErr.message)

  // 3b. Verify it actually deleted (since missing RLS DELETE policies silently drop operations)
  const { data: survivalCheck } = await supabase.from('projects').select('id').eq('id', id)
  if (survivalCheck && survivalCheck.length > 0) {
    throw new Error('Supabase RLS Blocked Deletion. You need to enable DELETE policies in the Supabase Dashboard.')
  }

  // 4. Finally, cleanup memberships (this may be redundant if ON DELETE CASCADE exists, but harmless)
  await supabase.from('project_members').delete().eq('project_id', id)
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
