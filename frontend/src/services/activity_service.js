import { supabase } from '../supabase_client'

let mockActivities = []

export const getActivityLog = async (submittalId) => {
  if (typeof window !== 'undefined' && localStorage.getItem('sb-test-mode') === 'true') {
    return mockActivities.filter(a => a.submittal_id === submittalId)
  }
  const { data, error } = await supabase
    .from('activity_log')
    .select('*')
    .eq('submittal_id', submittalId)
    .order('created_at', { ascending: true })
  if (error) throw error
  return data
}

export const getAllActivityLogs = async (submittalIds) => {
  if (typeof window !== 'undefined' && localStorage.getItem('sb-test-mode') === 'true') {
    return mockActivities.filter(a => submittalIds.includes(a.submittal_id))
  }
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
  if (typeof window !== 'undefined' && localStorage.getItem('sb-test-mode') === 'true') {
    const newAct = {
      id: 'test-act-' + Date.now(),
      submittal_id: submittalId,
      message,
      author,
      attachment_id: attachmentId,
      round: round,
      created_at: new Date().toISOString()
    }
    mockActivities.push(newAct)
    return newAct
  }
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

export const toggleActivityFlag = async (activityId, isFlagged) => {
  if (typeof window !== 'undefined' && localStorage.getItem('sb-test-mode') === 'true') {
    const act = mockActivities.find(a => a.id === activityId)
    if (act) act.is_flagged = isFlagged
    return act
  }
  const { data, error } = await supabase
    .from('activity_log')
    .update({ is_flagged: isFlagged })
    .eq('id', activityId)
    .select()
    .single()
  if (error) throw error
  return data
}
