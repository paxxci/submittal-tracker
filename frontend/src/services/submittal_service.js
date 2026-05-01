import { supabase } from '../supabase_client'
import { addActivity } from './activity_service'

let mockSubmittals = null;

export const getSubmittals = async (projectId) => {
  const isTestMode = typeof window !== 'undefined' && localStorage.getItem('sb-test-mode') === 'true'
  if (isTestMode) {
    if (!mockSubmittals) {
      mockSubmittals = [{
        id: 'test-sub-1',
        project_id: projectId,
        item_name: 'Test Submittal 001',
        status: 'working',
        priority: 'medium',
        bic: 'GC',
        round: 1,
        created_at: new Date().toISOString(),
        spec_sections: { csi_code: '01 00 00', title: 'General Requirements' },
        attachments: []
      }]
    }
    return [...mockSubmittals]
  }

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
    // Only nullify if explicitly empty string (e.g., cleared by user in form)
    // If undefined, it means this is a partial update and the field isn't included.
    if (cleaned[field] === '') {
      cleaned[field] = null
    }
  }
  // Ensure expected_days is an integer, but only if it was actually provided
  if (cleaned.expected_days !== undefined) {
    cleaned.expected_days = parseInt(cleaned.expected_days) || 21
  }
  return cleaned
}

export const createSubmittal = async (fields, authorRoleOrUser = null) => {
  const isTestMode = typeof window !== 'undefined' && localStorage.getItem('sb-test-mode') === 'true'
  if (isTestMode) {
    const newSub = {
      id: 'test-sub-' + Date.now(),
      ...fields,
      item_name: fields.item_name || 'New Submittal',
      status: fields.status || 'not_started',
      priority: fields.priority || 'medium',
      bic: fields.bic || 'PM',
      created_at: new Date().toISOString(),
      spec_sections: { csi_code: fields.spec_section || '00 00 00', title: 'Test Section' }
    }
    if (mockSubmittals) {
      mockSubmittals.push(newSub)
    } else {
      mockSubmittals = [newSub]
    }
    return newSub
  }

  const authorRole = typeof authorRoleOrUser === 'string'
    ? authorRoleOrUser
    : (authorRoleOrUser?.user_metadata?.full_name || authorRoleOrUser?.email || 'System')

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

export const updateSubmittal = async (id, updates, authorRoleOrUser = null, options = {}) => {
  const isTestMode = typeof window !== 'undefined' && localStorage.getItem('sb-test-mode') === 'true'
  if (isTestMode) {
    if (mockSubmittals) {
      mockSubmittals = mockSubmittals.map(s => s.id === id ? { ...s, ...updates } : s)
    }
    return { id, ...updates }
  }

  const authorRole = typeof authorRoleOrUser === 'string'
    ? authorRoleOrUser
    : (authorRoleOrUser?.user_metadata?.full_name || authorRoleOrUser?.email || 'System')

  // Fetch current for comparison to log changes
  const { data: current } = await supabase.from('submittals').select('*').eq('id', id).single()

  const cleaned = cleanDates(updates)
  const { data, error } = await supabase
    .from('submittals')
    .update(cleaned)
    .eq('id', id)
    .select(`*, spec_sections(csi_code, title)`)
    .single()
  if (error) throw error

  // Log status/BIC changes
  if (current && !options.silent) {
    if (cleaned.status && cleaned.status !== current.status) {
      if (options.customActivityMsg) {
        await addActivity(id, options.customActivityMsg, authorRole, { round: data.round })
      } else {
        const statusLabel = cleaned.status.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')
        await addActivity(id, `Status changed to: ${statusLabel}`, authorRole, { round: data.round })
      }
    } else if (options.customActivityMsg) {
      // Log custom message even if status didn't change (e.g. manual override)
      await addActivity(id, options.customActivityMsg, authorRole, { round: data.round })
    }

    if (cleaned.bic && cleaned.bic !== current.bic) {
      await addActivity(id, `BIC changed to: ${cleaned.bic.toUpperCase()}`, authorRole, { round: data.round })
    }
  }

  return data
}

export const deleteSubmittal = async (id) => {
  if (typeof window !== 'undefined' && localStorage.getItem('sb-test-mode') === 'true') {
    if (mockSubmittals) {
      mockSubmittals = mockSubmittals.filter(s => s.id !== id)
    }
    return true
  }
  const { error } = await supabase.from('submittals').delete().eq('id', id)
  if (error) throw error
}
