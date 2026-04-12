import { supabase } from '../supabase_client'

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

export const addActivity = async (submittalId, message, author = 'You', { attachmentId = null, round = null } = {}) => {
  const { data, error } = await supabase
    .from('activity_log')
    .insert([{ 
      submittal_id: submittalId, 
      message, 
      author,
      attachment_id: attachmentId,
      round: round
    }])
    .select()
    .single()
  if (error) throw error
  return data
}
