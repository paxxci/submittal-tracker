import React, { useState } from 'react'
import { Shield, Lock, CheckCircle2, AlertCircle, ArrowRight, RefreshCw } from 'lucide-react'
import { supabase } from '../supabase_client'

export default function AccountSecurity() {
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(false)

  const handleUpdate = async (e) => {
    e.preventDefault()
    if (password !== confirm) {
      return setError("Passwords do not match.")
    }
    if (password.length < 6) {
      return setError("Password must be at least 6 characters.")
    }

    setLoading(true)
    setError(null)
    setSuccess(false)

    try {
      const { error } = await supabase.auth.updateUser({ password })
      if (error) throw error
      setSuccess(true)
      setPassword('')
      setConfirm('')
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <div className="top-bar">
        <span className="top-bar-title">Account & Security</span>
        <span className="top-bar-sub" style={{ marginLeft: 8 }}>— Protect your credentials</span>
      </div>

      <div className="stage-body" style={{ maxWidth: 500, margin: '24px auto' }}>
        <div className="card" style={{ padding: 40, background: 'var(--bg-modal)', textAlign: 'center' }}>
          <div style={{ 
            width: 64, height: 64, borderRadius: 16, 
            background: 'var(--accent-dim)', color: 'var(--accent)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 24px', border: '1px solid var(--border-hover)'
          }}>
            <Shield size={32} />
          </div>

          <h2 style={{ fontSize: 24, fontWeight: 900, marginBottom: 8 }}>Password Security</h2>
          <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 32, lineHeight: 1.6 }}>
            Update your account password. This will take effect immediately without requiring an email link.
          </p>

          <form onSubmit={handleUpdate} style={{ textAlign: 'left' }}>
            {error && (
              <div style={{ 
                background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)', 
                color: '#ef4444', padding: '12px 16px', borderRadius: 8, marginBottom: 20, 
                display: 'flex', alignItems: 'center', gap: 10, fontSize: 13 
              }}>
                <AlertCircle size={16} />
                {error}
              </div>
            )}

            {success && (
              <div style={{ 
                background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.2)', 
                color: '#10b981', padding: '12px 16px', borderRadius: 8, marginBottom: 20, 
                display: 'flex', alignItems: 'center', gap: 10, fontSize: 13 
              }}>
                <CheckCircle2 size={16} />
                Password updated successfully!
              </div>
            )}

            <div className="form-group" style={{ marginBottom: 16 }}>
              <label className="form-label">New Password</label>
              <div style={{ position: 'relative' }}>
                <Lock size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input 
                  type="password" 
                  className="form-input" 
                  style={{ paddingLeft: 38 }}
                  placeholder="••••••••"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required 
                  minLength={6}
                />
              </div>
            </div>

            <div className="form-group" style={{ marginBottom: 24 }}>
              <label className="form-label">Confirm New Password</label>
              <div style={{ position: 'relative' }}>
                <Lock size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input 
                  type="password" 
                  className="form-input" 
                  style={{ paddingLeft: 38 }}
                  placeholder="••••••••"
                  value={confirm}
                  onChange={e => setConfirm(e.target.value)}
                  required 
                />
              </div>
            </div>

            <button 
              type="submit" 
              className="btn btn-primary" 
              style={{ width: '100%', height: 44, justifyContent: 'center', fontSize: 14 }}
              disabled={loading}
            >
              {loading ? (
                <>
                  <RefreshCw size={18} className="animate-spin" />
                  Updating...
                </>
              ) : (
                <>
                  Update Password
                  <ArrowRight size={18} />
                </>
              )}
            </button>
          </form>

          <p style={{ marginTop: 24, fontSize: 11, color: 'var(--text-dim)', textAlign: 'center' }}>
            Next time you log in, please use your new secure password.
          </p>
        </div>
      </div>
    </>
  )
}
