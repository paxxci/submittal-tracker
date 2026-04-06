export const calculateExpectedDate = (submittedDate, reviewDuration = 15) => {
  if (!submittedDate) return null
  
  const date = new Date(submittedDate + 'T00:00:00')
  date.setDate(date.getDate() + parseInt(reviewDuration, 10))
  
  return date.toISOString().split('T')[0]
}

export const isSubmittalOverdue = (expectedDate, status) => {
  if (!expectedDate) return false
  if (['approved', 'rejected'].includes(status)) return false
  
  const today = new Date().toISOString().split('T')[0]
  return expectedDate < today
}

export const formatDate = (dateString, options = { month: 'short', day: 'numeric' }) => {
  if (!dateString) return '—'
  // Use T00:00:00 to avoid timezone shifts on simple date strings
  const dateObj = new Date(dateString + 'T00:00:00')
  return dateObj.toLocaleDateString('en-US', options)
}
