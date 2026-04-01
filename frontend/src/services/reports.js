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
