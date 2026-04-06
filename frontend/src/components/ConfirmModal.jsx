import React, { useState, useEffect } from 'react'
import { AlertTriangle, Trash2, X, ShieldAlert } from 'lucide-react'

/**
 * ConfirmModal
 * @param {boolean} isOpen - Control visibility
 * @param {string} title - Main headline
 * @param {string} message - Secondary explanation
 * @param {string} confirmText - If provided, triggers "Extreme Mode" (requires typing this text)
 * @param {string} confirmLabel - Text for the confirm button
 * @param {string} type - 'danger' (red) | 'alert' (orange) | 'info' (cyan)
 * @param {function} onConfirm - Success callback
 * @param {function} onCancel - Cancel callback
 */
export default function ConfirmModal({
  isOpen,
  title = 'Are you sure?',
  message = 'This action cannot be undone.',
  confirmText,
  confirmLabel = 'Confirm Action',
  type = 'danger',
  onConfirm,
  onCancel
}) {
  const [userInput, setUserInput] = useState('')
  const [isAnimating, setIsAnimating] = useState(false)

  useEffect(() => {
    if (isOpen) {
      setUserInput('')
      setIsAnimating(true)
    } else {
      setIsAnimating(false)
    }
  }, [isOpen])

  if (!isOpen) return null

  const isExtreme = !!confirmText
  const canConfirm = isExtreme ? userInput.trim() === confirmText : true

  const handleConfirm = () => {
    if (canConfirm) {
      onConfirm()
      onCancel() // Close
    }
  }

  const colors = {
    danger: { main: 'var(--s-rejected)', bg: 'rgba(239, 68, 68, 0.1)', icon: <Trash2 size={24} /> },
    alert: { main: 'var(--s-revise)', bg: 'rgba(249, 115, 22, 0.1)', icon: <AlertTriangle size={24} /> },
    info: { main: 'var(--accent)', bg: 'rgba(0, 186, 198, 0.1)', icon: <ShieldAlert size={24} /> },
  }[type] || colors.danger

  return (
    <div className={`modal-backdrop ${isAnimating ? 'animate-in' : ''}`} 
      style={{ zIndex: 10000 }}
      onClick={(e) => e.target === e.currentTarget && onCancel()}>
      
      <div className="modal" style={{ 
        maxWidth: 420, 
        textAlign: 'center', 
        padding: '36px 32px',
        border: `1px solid ${colors.main}30`,
        boxShadow: `0 24px 48px -12px rgba(0,0,0,0.5), 0 0 20px ${colors.main}10`
      }}>
        {/* Close Button */}
        <button 
          className="btn btn-icon btn-sm" 
          onClick={onCancel}
          style={{ position: 'absolute', top: 16, right: 16, opacity: 0.5 }}
        >
          <X size={16} />
        </button>

        {/* Header Icon */}
        <div style={{ 
          width: 64, height: 64, borderRadius: '50%', 
          background: colors.bg, color: colors.main,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          margin: '0 auto 24px'
        }}>
          {colors.icon}
        </div>

        {/* Content */}
        <h2 style={{ fontSize: 22, fontWeight: 900, marginBottom: 8, letterSpacing: '-0.3px' }}>
          {title}
        </h2>
        <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 24, lineHeight: 1.6 }}>
          {message}
        </p>

        {/* Extreme Mode Input */}
        {isExtreme && (
          <div style={{ marginBottom: 24 }}>
            <label style={{ 
              display: 'block', fontSize: 10, fontWeight: 800, 
              color: colors.main, textTransform: 'uppercase', 
              letterSpacing: '1px', marginBottom: 8 
            }}>
              Type <span style={{ color: 'var(--text)' }}>{confirmText}</span> to confirm
            </label>
            <input 
              className="form-input"
              style={{ 
                textAlign: 'center', fontSize: 15, fontWeight: 700, 
                letterSpacing: '1px', background: 'rgba(0,0,0,0.2)',
                borderColor: userInput === confirmText ? colors.main : 'var(--border)'
              }}
              placeholder="---"
              value={userInput}
              onChange={e => setUserInput(e.target.value)}
              autoFocus
            />
          </div>
        )}

        {/* Actions */}
        <div style={{ display: 'flex', gap: 12 }}>
          <button 
            className="btn btn-ghost" 
            style={{ flex: 1 }}
            onClick={onCancel}
          >
            Cancel
          </button>
          <button 
            className="btn" 
            style={{ 
              flex: 1, 
              background: colors.main, 
              color: 'white', 
              border: 'none',
              opacity: canConfirm ? 1 : 0.4,
              cursor: canConfirm ? 'pointer' : 'not-allowed'
            }}
            onClick={handleConfirm}
            disabled={!canConfirm}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
