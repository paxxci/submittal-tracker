import React from 'react'

const STATUS_CONFIG = {
  not_started:     { label: 'Not Started',       cls: 'badge-not_started'  },
  pending:         { label: 'Pending',            cls: 'badge-pending'      },
  working:         { label: 'Working',            cls: 'badge-working'      },
  submitted:       { label: 'Submitted',          cls: 'badge-submitted'    },
  in_review:       { label: 'In Review',          cls: 'badge-in_review'    },
  approved:        { label: 'Approved',           cls: 'badge-approved'     },
  approved_as_noted:{ label: 'Approved as Noted', cls: 'badge-approved_as_noted' },
  revise_resubmit: { label: 'Revise & Resubmit',  cls: 'badge-revise_resubmit' },
  rejected:        { label: 'Rejected',           cls: 'badge-rejected'     },
}

const BIC_CONFIG = {
  you:       { label: 'YOU',       cls: 'bic-you'      },
  pm:        { label: 'PM',        cls: 'bic-pm'       },
  gc:        { label: 'GC',        cls: 'bic-gc'       },
  engineer:  { label: 'ENGINEER',  cls: 'bic-engineer' },
  architect: { label: 'ARCHITECT', cls: 'bic-architect'},
  vendor:    { label: 'VENDOR',    cls: 'bic-vendor'   },
}

const PRIORITY_CONFIG = {
  high:   { label: 'H', cls: 'priority-chip-high'   },
  medium: { label: 'M', cls: 'priority-chip-medium' },
  low:    { label: 'L', cls: 'priority-chip-low'    },
}

export function StatusBadge({ status }) {
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.not_started
  return (
    <span className={`badge ${cfg.cls}`}>
      <span className="badge-dot" style={{ background: 'currentColor' }} />
      {cfg.label}
    </span>
  )
}

export function BicChip({ bic }) {
  // First, check exact match
  let cfg = BIC_CONFIG[bic]
  
  // If not an exact match but exists, try to intelligently match custom names
  if (!cfg && bic) {
    const lBic = bic.toLowerCase()
    if (lBic.includes('vendor')) cfg = BIC_CONFIG.vendor
    else if (lBic.includes('architect')) cfg = BIC_CONFIG.architect
    else if (lBic.includes('engineer') || lBic.includes('eng')) cfg = BIC_CONFIG.engineer
    else if (lBic.includes('gc') || lBic.includes('general contractor')) cfg = BIC_CONFIG.gc
    else if (lBic.includes('pm') || lBic.includes('manager')) cfg = BIC_CONFIG.pm
  }

  if (cfg) return <span className={`bic-chip ${cfg.cls}`}>{bic && !BIC_CONFIG[bic] ? bic : cfg.label}</span>
  
  // Custom contact name with no recognizable role — show as neutral chip
  if (!bic) return null
  return (
    <span className="bic-chip" style={{
      background: 'rgba(148,163,184,0.1)',
      color: 'var(--text-sub)',
      border: '1px solid var(--border)',
    }}>
      {bic}
    </span>
  )
}

export function PriorityBar({ priority }) {
  return <div className={`priority-bar priority-${priority}`} />
}

export function PriorityChip({ priority }) {
  const cfg = PRIORITY_CONFIG[priority] || PRIORITY_CONFIG.medium
  return <span className={`priority-chip ${cfg.cls}`}>{cfg.label}</span>
}

export const STATUS_OPTIONS = Object.entries(STATUS_CONFIG).map(([value, { label }]) => ({ value, label }))
export const BIC_OPTIONS = Object.entries(BIC_CONFIG).map(([value, { label }]) => ({ value, label }))
