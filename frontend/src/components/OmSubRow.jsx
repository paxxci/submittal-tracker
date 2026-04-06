import React from 'react'
import { BookOpen, ExternalLink } from 'lucide-react'
import { formatDate } from '../logic/date_engine'

export default function OmSubRow({ om }) {
  return (
    <tr className="om-sub-row" id={`om-row-${om.id}`}>
      <td style={{ width: 28, padding: 0 }} />
      <td style={{ width: 100, paddingLeft: 20, paddingRight: 4, color: 'var(--text-muted)', fontSize: 12 }}>└─</td>
      <td colSpan={4} style={{ paddingLeft: 4 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <BookOpen size={11} style={{ color: 'var(--s-approved)', flexShrink: 0 }} />
          <span style={{ fontSize: 11, color: 'var(--text-sub)' }}>{om.file_name}</span>
          <span style={{
            fontSize: 9, fontWeight: 700, letterSpacing: '0.5px',
            color: 'var(--s-approved)', background: 'rgba(16,185,129,0.1)',
            padding: '1px 5px', borderRadius: 3,
          }}>O&amp;M</span>
          {om.uploaded_at && (
            <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>· {formatDate(om.uploaded_at, { month: 'short', day: 'numeric', year: 'numeric' })}</span>
          )}
        </div>
      </td>
      <td style={{ textAlign: 'center' }} />
      <td>
        <a href={om.file_url} target="_blank" rel="noopener noreferrer"
          className="btn btn-icon btn-sm" title="Open file" style={{ border: 'none' }}
          onClick={e => e.stopPropagation()}>
          <ExternalLink size={11} style={{ color: 'var(--s-approved)' }} />
        </a>
      </td>
    </tr>
  )
}
