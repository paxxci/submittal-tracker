import React from 'react'
import { Trash2, ChevronRight, AlertTriangle, Building2, BookOpen, Star } from 'lucide-react'
import { StatusBadge, BicChip, PriorityChip } from './StatusBadge'
import { calculateExpectedDate, isSubmittalOverdue, formatDate } from '../logic/date_engine'

function BicDisplay({ bic }) {
  if (!bic) return null

  // Standard roles (e.g. "ENGINEER", "ARCHITECT")
  const isStandard = ['you', 'pm', 'gc', 'engineer', 'architect', 'vendor'].includes(bic.toLowerCase())

  if (isStandard) {
    return <BicChip bic={bic} />
  }

  // Custom contact parsing: "Name (Company)"
  // Priority: Company (match[2]), then Name (match[1])
  const match = bic.match(/^(.*?)\s*\((.*?)\)$/)

  if (match) {
    const person = match[1]
    const company = match[2]
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
        <div style={{ fontWeight: 700, fontSize: 12, color: 'var(--text-sub)' }}>{company}</div>
        <div className="td-name-sub" style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <ChevronRight size={9} style={{ opacity: 0.6 }} />
          {person}
        </div>
      </div>
    )
  }

  // Fallback for single strings (could be just Name or just Company)
  return <div style={{ fontWeight: 700, fontSize: 12, color: 'var(--text-sub)' }}>{bic}</div>
}

export default function SubmittalRow({ sub, today, tags = [], selected, onClick, onDelete }) {
  const expectedDate = calculateExpectedDate(sub.submitted_date, sub.expected_days)
  const overdue = isSubmittalOverdue(expectedDate, sub.status)
  const isApproved = sub.status === 'approved'

  const hasOM = tags.some(t => t.type === 'om')
  const hasApprovedDoc = tags.some(t => t.is_approved_version)

  const rowClass = [
    'submittal-row',
    selected ? 'selected' : '',
    isApproved ? 'row-approved' : ''
  ].filter(Boolean).join(' ')

  return (
    <tr className={rowClass} onClick={onClick} id={`row-${sub.id}`}>
      <td style={{ width: 28, textAlign: 'center', padding: '0 4px' }}>
        <PriorityChip priority={sub.priority} />
      </td>
      <td style={{ width: 100 }}>
        <span style={{
          fontSize: 12, fontWeight: 800,
          color: isApproved ? 'var(--s-approved)' : 'var(--accent)',
          letterSpacing: '0.5px'
        }}>
          {sub.spec_sections?.csi_code || '—'}
        </span>
      </td>
      <td className="td-name">
        <div style={{ fontSize: 14, fontWeight: 700, color: isApproved ? 'var(--s-approved)' : '#fff', marginBottom: 2 }}>{sub.item_name}</div>
        {sub.next_action && (
          <div className="td-name-sub" style={{ display: 'flex', alignItems: 'center', gap: 4, color: 'var(--accent)', marginTop: 4 }}>
            <ChevronRight size={9} style={{ color: 'var(--accent)' }} />
            <span style={{ fontWeight: 800, fontSize: '9px', textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--accent)', opacity: 0.8 }}>Next Action:</span>
            {sub.next_action}
          </div>
        )}
        
        {/* Document Indicator Badges */}
        {(hasOM || hasApprovedDoc) && (
          <div style={{ display: 'flex', gap: '6px', marginTop: '6px' }}>
            {hasApprovedDoc && (
              <span style={{
                display: 'inline-flex', alignItems: 'center', gap: '4px',
                fontSize: 9, fontWeight: 700, letterSpacing: '0.5px',
                color: 'var(--s-approved)', background: 'rgba(16,185,129,0.1)',
                padding: '2px 6px', borderRadius: 4,
              }}>
                <Star size={10} fill="var(--s-approved)" /> APPROVED VERSION
              </span>
            )}
            {hasOM && (
              <span style={{
                display: 'inline-flex', alignItems: 'center', gap: '4px',
                fontSize: 9, fontWeight: 700, letterSpacing: '0.5px',
                color: 'var(--s-approved)', background: 'rgba(16,185,129,0.1)',
                padding: '2px 6px', borderRadius: 4,
              }}>
                <BookOpen size={10} /> O&amp;M DOCUMENT
              </span>
            )}
          </div>
        )}
      </td>
      <td><StatusBadge status={sub.status} /></td>
      <td>
        <BicDisplay bic={sub.bic} />
      </td>
      <td className="td-date">
        {formatDate(sub.submitted_date)}
      </td>
      <td className={`td-date ${overdue ? 'overdue' : ''}`}>
        {isApproved ? (
          <span style={{ color: 'var(--text-dim)' }}>—</span>
        ) : (
          <>
            {overdue && <AlertTriangle size={10} style={{ marginRight: 4, display: 'inline' }} />}
            {formatDate(expectedDate)}
          </>
        )}
      </td>
      <td style={{ textAlign: 'center' }}>
        {sub.round > 1
          ? <span style={{ color: 'var(--s-revise)', fontWeight: 700, fontSize: 11 }}>Rev {sub.round}</span>
          : <span style={{ color: 'var(--text-dim)', fontSize: 11 }}>—</span>}
      </td>
      <td>
        <div className="row-actions">
          <button
            className="btn btn-icon btn-sm"
            style={{ color: 'var(--s-rejected)', border: 'none' }}
            onClick={e => onDelete(sub.id, e)}
            title="Delete"
          >
            <Trash2 size={12} />
          </button>
        </div>
      </td>
    </tr>
  )
}
