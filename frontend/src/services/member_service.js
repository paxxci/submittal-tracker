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

export const addProjectMember = async (projectId, email, role = 'editor', name = '') => {
  const { data, error } = await supabase
    .from('project_members')
    .insert([{ project_id: projectId, email, role, name }])
    .select()
    .single()
  if (error) throw error
  return data
}

export const removeProjectMember = async (id) => {
  const { error } = await supabase.from('project_members').delete().eq('id', id)
  if (error) throw error
}
