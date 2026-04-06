import React from 'react'
import { Trash2, ChevronRight, AlertTriangle } from 'lucide-react'
import { StatusBadge, BicChip, PriorityChip } from './StatusBadge'
import { calculateExpectedDate, isSubmittalOverdue, formatDate } from '../logic/date_engine'

export default function SubmittalRow({ sub, today, selected, onClick, onDelete }) {
  const expectedDate = calculateExpectedDate(sub.submitted_date, sub.review_duration)
  const overdue = isSubmittalOverdue(expectedDate, sub.status)
  const isApproved = sub.status === 'approved'
  
  const rowClass = [
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
          fontSize: 11, fontWeight: 700,
          color: isApproved ? 'var(--s-approved)' : 'var(--accent)',
          letterSpacing: '0.3px'
        }}>
          {sub.spec_sections?.csi_code || '—'}
        </span>
      </td>
      <td className="td-name">
        <div>{sub.item_name}</div>
        {sub.next_action && (
          <div className="td-name-sub" style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <ChevronRight size={9} />
            {sub.next_action}
          </div>
        )}
      </td>
      <td><StatusBadge status={sub.status} /></td>
      <td><BicChip bic={sub.bic} /></td>
      <td className={`td-date ${overdue ? 'overdue' : ''}`}>
        {overdue && <AlertTriangle size={10} style={{ marginRight: 4, display: 'inline' }} />}
        {formatDate(expectedDate)}
      </td>
      <td className="td-date">
        {formatDate(sub.submitted_date)}
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
