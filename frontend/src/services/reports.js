import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'

/**
 * Generates a professional, branded PDF report for a project submittal log.
 * @param {Object} project - The project metadata object.
 * @param {Array} submittals - Array of submittal objects with spec_sections joined.
 * @returns {jsPDF} - The generated jsPDF instance.
 */
export const generateProjectReport = (project, submittals) => {
  const doc = new jsPDF()
  const now = new Date().toLocaleDateString()

  // 1. Header Branded Content
  doc.setFontSize(22)
  doc.setTextColor(7, 13, 26) // Deep Navy (matching --bg-base approx)
  doc.text('SUBMITTAL TRACKER LOG', 14, 22)

  doc.setFontSize(9)
  doc.setTextColor(148, 163, 184) // Gray (--text-muted)
  doc.text(`GENERATED: ${now}`, 14, 28)

  // 2. Project Details
  doc.setFontSize(14)
  doc.setTextColor(0)
  doc.text(project?.name || 'UNNAMED PROJECT', 14, 42)
  
  doc.setFontSize(9)
  doc.setTextColor(71, 85, 105) // (--text-muted)
  doc.text(`Project #: ${project?.number || 'N/A'}`, 14, 48)
  doc.text(`Client: ${project?.client || 'N/A'}`, 14, 53)
  doc.text(`Address: ${project?.address || 'N/A'}`, 14, 58)

  // 3. Stats Summary Box
  const total = submittals.length
  const approved = submittals.filter(s => s.status === 'approved').length
  const pending = submittals.filter(s => s.status === 'submitted' || s.status === 'in_review').length
  const percent = total > 0 ? Math.round((approved / total) * 100) : 0

  doc.setDrawColor(226, 232, 240) // (--border)
  doc.setFillColor(248, 250, 252) // Light Gray background for box
  doc.rect(140, 35, 56, 30, 'FD')

  doc.setFontSize(8)
  doc.setTextColor(71, 85, 105)
  doc.text('COMPLETION PROGRESS', 145, 42)
  
  doc.setFontSize(18)
  // Green if 100%, else Navy
  if (percent === 100) {
    doc.setTextColor(16, 185, 129) // Success Green
  } else {
    doc.setTextColor(7, 13, 26)
  }
  doc.text(`${percent}%`, 145, 52)
  
  doc.setFontSize(8)
  doc.setTextColor(100)
  doc.text(`${approved} of ${total} Items Approved`, 145, 60)

  // 4. The Log Table
  const tableData = submittals.map(s => [
    s.spec_sections?.csi_code || '-',
    s.item_name || 'Unnamed Item',
    s.status.toUpperCase().replace('_', ' '),
    s.bic.toUpperCase(),
    s.due_date ? new Date(s.due_date).toLocaleDateString() : '-'
  ])

  // ROBUST PLUG-IN CALL
  const options = {
    startY: 75,
    head: [['CSI CODE', 'ITEM DESCRIPTION', 'STATUS', 'B.I.C.', 'DUE DATE']],
    body: tableData,
    theme: 'grid',
    headStyles: { 
      fillColor: [7, 13, 26], // Logo Navy
      textColor: 255, 
      fontSize: 8, 
      fontStyle: 'bold' 
    },
    bodyStyles: { 
      fontSize: 8, 
      textColor: 50 
    },
    columnStyles: {
      0: { cellWidth: 25 },
      1: { cellWidth: 'auto' },
      2: { cellWidth: 25 },
      3: { cellWidth: 25 },
      4: { cellWidth: 25 }
    },
    styles: { 
      overflow: 'linebreak',
      cellPadding: 3
    }
  }

  // Handle both registration methods
  if (typeof autoTable === 'function') {
    autoTable(doc, options)
  } else if (doc.autoTable) {
    doc.autoTable(options)
  } else {
    console.warn('PDF autoTable plugin not found')
  }

  // 5. Footer (Page Numbers)
  const pageCount = doc.internal.getNumberOfPages()
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i)
    doc.setFontSize(8)
    doc.setTextColor(150)
    doc.text(
      `Page ${i} of ${pageCount}`, 
      doc.internal.pageSize.width / 2, 
      doc.internal.pageSize.height - 10, 
      { align: 'center' }
    )
  }

  return doc
}

/**
 * Generates a branded PDF report for a submittal's Activity Log.
 */
export const generateActivityLogReport = (submittal, logData) => {
  const doc = new jsPDF()
  const now = new Date().toLocaleDateString()

  // Header 
  doc.setFontSize(22)
  doc.setTextColor(7, 13, 26)
  doc.text('ACTIVITY LOG', 14, 22)

  doc.setFontSize(9)
  doc.setTextColor(148, 163, 184)
  doc.text(`GENERATED: ${now}`, 14, 28)

  doc.setFontSize(14)
  doc.setTextColor(0)
  doc.text(submittal?.item_name || 'Unnamed Submittal', 14, 42)
  
  doc.setFontSize(9)
  doc.setTextColor(71, 85, 105)
  doc.text(`Spec Section: ${submittal?.spec_section || 'N/A'}`, 14, 48)

  const validLogs = logData.filter(entry => {
    return typeof entry.message !== 'string' || !entry.message.includes('Auto-Audit:')
  })

  const tableData = validLogs.map(entry => {
     const dt = new Date(entry.created_at).toLocaleString()
     
     const clean = (val) => {
       if (typeof val !== 'string' || !val.trim().startsWith('{')) return val
       try {
         const p = JSON.parse(val)
         if (p.email) return p.user_metadata?.full_name || p.email.split('@')[0]
         if (p.user_metadata) return p.user_metadata.full_name || 'User'
         if (p.id) return `System Action [${p.id.slice(0,8)}]`
         return '[Archive Data]'
       } catch { return val }
     }

     let author = clean(entry.author || 'System')
     if (author && author.includes('@')) {
       author = author.split('@')[0]
     }

     let msg = clean(entry.message).replace(/\n/g, ' ')
     
     // ASCII Text translations to mimic frontend emojis without breaking the PDF Font Engine
     msg = msg.replace(/\[R\d+\] Submittal Document uploaded: ".+?"/, '[FILE] Uploaded Document')
     msg = msg.replace(/O&M Document uploaded: ".+?"/, '[FILE] Uploaded O&M Document')
     msg = msg.replace(/Reference File uploaded: ".+?"/, '[FILE] Uploaded Reference File')
     msg = msg.replace(/🔄 Re-classified ".+?" to Revision (\d+)/, '[UPDATE] Changed to Revision $1')
     msg = msg.replace(/📤 OFFICIAL SUBMISSION FILED/, '[STATUS] Marked as Official Submission')
     msg = msg.replace(/✅ Stamped .+? as Officially Approved Version/, '[APPROVED]')
     msg = msg.replace(/⏪ Revoked Approval Stamp from .+?/, '[REVOKED] Removed Approval')
     msg = msg.replace(/🗑️ Deleted Document: ".+?"/, '[DELETED] Removed Document')
     msg = msg.replace(/🚀 Submittal Bumped to Revision \d+/, '[UPDATE] Bumped Revision')
     msg = msg.replace(/Created submittal: .+/, '[NEW] Created Submittal')
     msg = msg.replace(/🎯 Set Next Action: "(.*?)"/, '[ACTION] Next: "$1"')
     msg = msg.replace(/🎯 Cleared Next Action/, '[ACTION] Cleared Next Action')

     // Obliterate any remaining emojis/unicode characters that crash PDF fonts
     msg = msg.replace(/[^\x00-\x7F]/g, "")

     return [
       dt,
       author,
       msg
     ]
  })

  // Table Config
  const options = {
    startY: 55,
    head: [['DATE / TIME', 'USER', 'MESSAGE']],
    body: tableData,
    theme: 'grid',
    headStyles: { 
      fillColor: [7, 13, 26],
      textColor: 255, 
      fontSize: 8, 
      fontStyle: 'bold' 
    },
    bodyStyles: { 
      fontSize: 8, 
      textColor: 50 
    },
    columnStyles: {
      0: { cellWidth: 35 },
      1: { cellWidth: 40 }
      // Column 2 expands to fit remainder naturally
    },
    styles: { 
      overflow: 'linebreak',
      cellPadding: 4
    }
  }

  if (typeof autoTable === 'function') {
    autoTable(doc, options)
  } else if (doc.autoTable) {
    doc.autoTable(options)
  } else {
    console.warn('PDF autoTable plugin not found')
  }

  // Footer (Page Numbers)
  const pageCount = doc.internal.getNumberOfPages()
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i)
    doc.setFontSize(8)
    doc.setTextColor(150)
    doc.text(
      `Page ${i} of ${pageCount}`, 
      doc.internal.pageSize.width / 2, 
      doc.internal.pageSize.height - 10, 
      { align: 'center' }
    )
  }

  return doc
}
