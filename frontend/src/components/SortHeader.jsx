import React from 'react'

export default function SortTh({ label, field, sortField, sortDir, onSort, style }) {
  const active = sortField === field
  return (
    <th
      onClick={() => onSort(field)}
      style={{
        cursor: 'pointer', userSelect: 'none',
        color: active ? 'var(--accent)' : undefined,
        ...style,
      }}
    >
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3 }}>
        {label}
        <span style={{ fontSize: 9, opacity: active ? 1 : 0.3 }}>
          {active ? (sortDir === 'asc' ? '↑' : '↓') : '↕'}
        </span>
      </span>
    </th>
  )
}
