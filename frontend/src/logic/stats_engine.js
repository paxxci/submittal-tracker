import { supabase } from '../supabase_client'

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

export const calculateCompletionPercentage = (approved, total) => {
  if (!total || total === 0) return 0
  return Math.round((approved / total) * 100)
}
