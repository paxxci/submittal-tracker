import { supabase } from '../supabase_client'

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

export const toggleAttachmentApproval = async (submittalId, attachmentId, setApproved) => {
  if (setApproved) {
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
  } else {
    const { data, error } = await supabase
      .from('attachments')
      .update({ is_approved_version: false })
      .eq('id', attachmentId)
      .select()
      .single()
    if (error) throw error
    return data
  }
}

export const updateAttachmentRound = async (id, round) => {
  const { data, error } = await supabase.from('attachments').update({ round }).eq('id', id).select().single()
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
