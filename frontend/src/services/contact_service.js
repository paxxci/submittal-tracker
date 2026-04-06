import { supabase } from '../supabase_client'

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
