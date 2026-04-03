import { supabase } from '../supabase_client'

// ─── PROJECTS ──────────────────────────────────────────────────────
// ─── PROJECTS ──────────────────────────────────────────────────────
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

export const uploadAttachment = async (submittalId, file, type = 'submittal', round = 1) => {
  const path = `${submittalId}/${Date.now()}_${file.name}`
  const { error: uploadError } = await supabase.storage
    .from('attachments')
    .upload(path, file)
  if (uploadError) throw uploadError

  const { data: { publicUrl } } = supabase.storage
    .from('attachments')
    .getPublicUrl(path)

  const { data, error } = await supabase
    .from('attachments')
    .insert([{ 
      submittal_id: submittalId, 
      file_name: file.name, 
      file_url: publicUrl, 
      type,
      round: parseInt(round)
    }])
    .select()
    .single()
  if (error) throw error
  return data
}

export const markAttachmentApproved = async (submittalId, attachmentId) => {
  // Reset all for this submittal
  await supabase
    .from('attachments')
    .update({ is_approved_version: false })
    .eq('submittal_id', submittalId)

  // Mark this one
  const { data, error } = await supabase
    .from('attachments')
    .update({ is_approved_version: true })
    .eq('id', attachmentId)
    .select()
    .single()
  if (error) throw error
  return data
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

// ─── PROJECT MEMBERS ───────────────────────────────────────────────
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
