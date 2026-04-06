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

export const createSubmittal = async (fields, authorRole = 'PM') => {
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

export const updateSubmittal = async (id, updates, authorRole = 'PM') => {
  // Fetch current for comparison to log changes
  const { data: current } = await supabase.from('submittals').select('*').eq('id', id).single()
  
  const { data, error } = await supabase
    .from('submittals')
    .update(cleanDates(updates))
    .eq('id', id)
    .select(`*, spec_sections(csi_code, title)`)
    .single()
  if (error) throw error

  // Automated Logging logic
  const changes = []
  if (updates.status && updates.status !== current.status) changes.push(`Status → ${updates.status.toUpperCase()}`)
  if (updates.bic && updates.bic !== current.bic) changes.push(`BIC → ${updates.bic.toUpperCase()}`)
  if (updates.priority && updates.priority !== current.priority) changes.push(`Priority → ${updates.priority.toUpperCase()}`)
  if (updates.due_date && updates.due_date !== current.due_date) changes.push(`Due Date → ${updates.due_date}`)
  if (updates.item_name && updates.item_name !== current.item_name) changes.push(`Description updated`)
  if (updates.spec_section && updates.spec_section !== current.spec_section) changes.push(`Spec Section updated`)
  if (updates.next_action && updates.next_action !== current.next_action) changes.push(`Updated Next Action`)
  if (updates.expected_days !== undefined && updates.expected_days !== current.expected_days) {
    changes.push(`Target Turnaround → ${updates.expected_days} Days`)
  }
  if (updates.round && updates.round !== current.round) changes.push(`REVISION → Rev ${updates.round}`)

  if (changes.length > 0) {
    await addActivity(id, `Auto-Audit: ${changes.join(', ')}`, authorRole)
  }

  return data
}

export const deleteSubmittal = async (id) => {
  const { error } = await supabase.from('submittals').delete().eq('id', id)
  if (error) throw error
}
