import { supabase } from '../supabase_client'

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
