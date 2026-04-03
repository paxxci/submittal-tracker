import React from 'react'
import { Check, X, FileText, Award } from 'lucide-react'

export default function ApprovedVersionModal({ files, onSelect, onClose }) {
  // Sort files by round descending so most recent is top
  const sorted = [...files].sort((a, b) => (b.round || 1) - (a.round || 1))

  return (
    <div className="modal-overlay" style={{ zIndex: 1000 }}>
      <div className="modal-card" style={{ maxWidth: 450, padding: 24 }}>
        <div style={{ textAlign: 'center', marginBottom: 20 }}>
          <div style={{ 
            width: 50, height: 50, borderRadius: '50%', background: 'rgba(34,197,94,0.1)', 
            color: 'var(--s-approved)', display: 'flex', alignItems: 'center', 
            justifyContent: 'center', margin: '0 auto 12px' 
          }}>
            <Award size={28} />
          </div>
          <h3 style={{ margin: 0, fontSize: 18, color: 'var(--text-sub)' }}>Mark Approved Version</h3>
          <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 8 }}>
            Pick the final document that was approved. This file will be locked and included in the project ZIP package. 🛡️🏆
          </p>
        </div>

        <div style={{ display: 'grid', gap: 8, maxHeight: 300, overflowY: 'auto', marginBottom: 20, paddingRight: 4 }}>
          {sorted.map(file => (
            <button 
              key={file.id}
              className="btn btn-ghost"
              style={{ 
                justifyContent: 'flex-start', textAlign: 'left', padding: '12px 16px', 
                border: '1px solid var(--border)', background: 'var(--bg-card)',
                height: 'auto', display: 'flex', gap: 12, alignItems: 'center'
              }}
              onClick={() => onSelect(file.id)}
            >
              <div style={{ 
                width: 32, height: 32, borderRadius: 6, background: 'rgba(0,186,198,0.1)', 
                color: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
              }}>
                <FileText size={16} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-sub)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {file.file_name}
                </div>
                <div style={{ fontSize: 11, color: 'var(--s-revise)', fontWeight: 700 }}>
                  Rev {file.round || 1}
                </div>
              </div>
              <Check size={16} style={{ opacity: 0.3 }} />
            </button>
          ))}
        </div>

        <div style={{ display: 'flex', gap: 10 }}>
          <button className="btn btn-ghost" style={{ flex: 1 }} onClick={onClose}>
            Decide Later
          </button>
        </div>
      </div>
    </div>
  )
}
