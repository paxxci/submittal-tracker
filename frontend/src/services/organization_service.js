import { supabase } from '../supabase_client'

export const getOrganizationForUser = async (userId) => {
  // 1. Try to find organization via profiling
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('organization_id')
    .eq('id', userId)
    .maybeSingle()
  
  if (profileError) throw profileError
  if (!profile?.organization_id) return null

  // 2. Fetch organization details
  const { data: org, error: orgError } = await supabase
    .from('organizations')
    .select('*')
    .eq('id', profile.organization_id)
    .maybeSingle()
  
  if (orgError) throw orgError
  return org
}

export const createOrganization = async (name, ownerId) => {
  const { data, error } = await supabase
    .from('organizations')
    .insert([{ name, owner_id: ownerId }])
    .select()
    .single()
  
  if (error) throw error
  return data
}
