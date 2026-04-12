import { supabase } from '../supabase_client'
import { addActivity } from './activity_service'

export const getSubmittals = async (projectId) => {
  const { data, error } = await supabase
    .from('submittals')
    .select(`*, spec_sections(csi_code, title), attachments(id, file_name, file_url, type, round, is_approved_version)`)
    .eq('project_id', projectId)
    .order('created_at', { ascending: true })
  if (error) throw error
  return data
}

const cleanDates = (obj) => {
  const DATE_FIELDS = ['due_date', 'submitted_date']
  const cleaned = { ...obj }
  for (const field of DATE_FIELDS) {
    if (cleaned[field] === '' || cleaned[field] === undefined) {
      cleaned[field] = null
    }
  }
  // Ensure expected_days is an integer
  if (cleaned.expected_days !== undefined) {
    cleaned.expected_days = parseInt(cleaned.expected_days) || 21
  }
  return cleaned
}

export const createSubmittal = async (fields, authorRoleOrUser = 'PM') => {
  const authorRole = typeof authorRoleOrUser === 'string' 
    ? authorRoleOrUser 
    : (authorRoleOrUser?.user_metadata?.full_name || authorRoleOrUser?.email || 'User')

  const { data, error } = await supabase
    .from('submittals')
    .insert([cleanDates(fields)])
    .select(`*, spec_sections(csi_code, title)`)
    .single()
  if (error) throw error
  
  // Auto-log creation
  await addActivity(data.id, `Created submittal: ${data.item_name}`, authorRole)
  
  return data
}

export const updateSubmittal = async (id, updates, authorRoleOrUser = 'PM') => {
  const authorRole = typeof authorRoleOrUser === 'string' 
    ? authorRoleOrUser 
    : (authorRoleOrUser?.user_metadata?.full_name || authorRoleOrUser?.email || 'User')

  // Fetch current for comparison to log changes
  const { data: current } = await supabase.from('submittals').select('*').eq('id', id).single()
  
  const { data, error } = await supabase
    .from('submittals')
    .update(cleanDates(updates))
    .eq('id', id)
    .select(`*, spec_sections(csi_code, title)`)
    .single()
  if (error) throw error



  return data
}

export const deleteSubmittal = async (id) => {
  const { error } = await supabase.from('submittals').delete().eq('id', id)
  if (error) throw error
}
