import { supabase } from '../supabase_client'

// ─── PROJECTS ──────────────────────────────────────────────────────
export const getProjects = async () => {
  const { data, error } = await supabase
    .from('projects')
    .select('*')
    .order('created_at', { ascending: false })
  if (error) throw error
  return data
}

export const createProject = async ({ name, number, client, address }) => {
  const { data, error } = await supabase
    .from('projects')
    .insert([{ name, number, client, address }])
    .select()
    .single()
  if (error) throw error
  return data
}

export const updateProject = async (id, updates) => {
  const { data, error } = await supabase
    .from('projects')
    .update(updates)
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

// ─── SPEC SECTIONS ─────────────────────────────────────────────────
export const getSpecSections = async (projectId) => {
  const { data, error } = await supabase
    .from('spec_sections')
    .select('*')
    .eq('project_id', projectId)
    .order('csi_code', { ascending: true })
  if (error) throw error
  return data
}

export const createSpecSection = async ({ project_id, csi_code, title, division }) => {
  const { data, error } = await supabase
    .from('spec_sections')
    .insert([{ project_id, csi_code, title, division }])
    .select()
    .single()
  if (error) throw error
  return data
}

export const deleteSpecSection = async (id) => {
  const { error } = await supabase.from('spec_sections').delete().eq('id', id)
  if (error) throw error
}

export const resolveSpecSectionId = async (projectId, csiCode) => {
  const code = (csiCode || 'GENERAL').trim()
  const { data: existing } = await supabase
    .from('spec_sections')
    .select('id')
    .eq('project_id', projectId)
    .eq('csi_code', code)
    .maybeSingle()
  
  if (existing) return existing.id
  
  const { data: created, error } = await supabase
    .from('spec_sections')
    .insert([{ project_id: projectId, csi_code: code, title: 'Manual Entry' }])
    .select('id')
    .single()
    
  if (error) throw error
  return created.id
}

// ─── SUBMITTALS ────────────────────────────────────────────────────
export const getSubmittals = async (projectId) => {
  const { data, error } = await supabase
    .from('submittals')
    .select(`*, spec_sections(csi_code, title)`)
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

  if (changes.length > 0) {
    await addActivity(id, `Auto-Audit: ${changes.join(', ')}`, authorRole)
  }

  return data
}

export const deleteSubmittal = async (id) => {
  const { error } = await supabase.from('submittals').delete().eq('id', id)
  if (error) throw error
}

// ─── ACTIVITY LOG ──────────────────────────────────────────────────
export const getActivityLog = async (submittalId) => {
  const { data, error } = await supabase
    .from('activity_log')
    .select('*')
    .eq('submittal_id', submittalId)
    .order('created_at', { ascending: true })
  if (error) throw error
  return data
}

export const getAllActivityLogs = async (submittalIds) => {
  if (!submittalIds.length) return []
  const { data, error } = await supabase
    .from('activity_log')
    .select('*')
    .in('submittal_id', submittalIds)
    .order('created_at', { ascending: false })
  if (error) throw error
  return data
}

export const addActivity = async (submittalId, message, author = 'You') => {
  const { data, error } = await supabase
    .from('activity_log')
    .insert([{ submittal_id: submittalId, message, author }])
    .select()
    .single()
  if (error) throw error
  return data
}

// ─── ATTACHMENTS ───────────────────────────────────────────────────
export const getAttachments = async (submittalId, type = null) => {
  let query = supabase
    .from('attachments')
    .select('*')
    .eq('submittal_id', submittalId)
    .order('uploaded_at', { ascending: false })
  if (type) query = query.eq('type', type)
  const { data, error } = await query
  if (error) throw error
  return data
}

export const getOmAttachmentsForSubmittals = async (submittalIds) => {
  if (!submittalIds.length) return []
  const { data, error } = await supabase
    .from('attachments')
    .select('*')
    .eq('type', 'om')
    .in('submittal_id', submittalIds)
    .order('uploaded_at', { ascending: true })
  if (error) throw error
  return data
}

export const uploadAttachment = async (submittalId, file, type = 'submittal') => {
  const ext = file.name.split('.').pop()
  const path = `${submittalId}/${type}/${Date.now()}.${ext}`

  const { error: uploadError } = await supabase.storage
    .from('attachments')
    .upload(path, file)
  if (uploadError) throw uploadError

  const { data: { publicUrl } } = supabase.storage
    .from('attachments')
    .getPublicUrl(path)

  const { data, error } = await supabase
    .from('attachments')
    .insert([{ submittal_id: submittalId, file_name: file.name, file_url: publicUrl, type }])
    .select()
    .single()
  if (error) throw error
  return data
}

export const deleteAttachment = async (id, fileUrl) => {
  // Extract storage path from URL
  const path = fileUrl.split('/attachments/')[1]
  if (path) {
    await supabase.storage.from('attachments').remove([path])
  }
  const { error } = await supabase.from('attachments').delete().eq('id', id)
  if (error) throw error
}

// ─── CONTACTS ──────────────────────────────────────────────────────
export const getContacts = async (projectId) => {
  const { data, error } = await supabase
    .from('contacts')
    .select('*')
    .eq('project_id', projectId)
    .order('name', { ascending: true })
  if (error) throw error
  return data
}

export const createContact = async (fields) => {
  const { data, error } = await supabase
    .from('contacts')
    .insert([fields])
    .select()
    .single()
  if (error) throw error
  return data
}

export const deleteContact = async (id) => {
  const { error } = await supabase.from('contacts').delete().eq('id', id)
  if (error) throw error
}

// ─── STATS HELPER ──────────────────────────────────────────────────
export const getProjectStats = async (projectId) => {
  const { data, error } = await supabase
    .from('submittals')
    .select('status, due_date, bic')
    .eq('project_id', projectId)
  if (error) throw error

  const today = new Date().toISOString().split('T')[0]
  return {
    total: data.length,
    pending: data.filter(s => s.status === 'pending').length,
    submitted: data.filter(s => s.status === 'submitted').length,
    in_review: data.filter(s => s.status === 'in_review').length,
    approved: data.filter(s => s.status === 'approved').length,
    revise: data.filter(s => s.status === 'revise_resubmit').length,
    rejected: data.filter(s => s.status === 'rejected').length,
    overdue: data.filter(s =>
      s.due_date && s.due_date < today &&
      !['approved', 'rejected'].includes(s.status)
    ).length,
    action_required: data.filter(s => 
      ['you', 'pm'].includes(s.bic?.toLowerCase()) && 
      !['approved', 'rejected'].includes(s.status)
    ).length
  }
}
