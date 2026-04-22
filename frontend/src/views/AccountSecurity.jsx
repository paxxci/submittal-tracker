import React, { useState } from 'react'
import { Shield, Lock, CheckCircle2, AlertCircle, ArrowRight, RefreshCw } from 'lucide-react'
import { supabase } from '../supabase_client'

export default function AccountSecurity({ userEmail }) {
  const [currentPassword, setCurrentPassword] = useState('')
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
      // 1. Get current logged in user email
      const { data: { user }, error: userError } = await supabase.auth.getUser()
      if (userError) throw userError

      // 2. Validate current password
      const { error: verifyError } = await supabase.auth.signInWithPassword({
        email: user.email,
        password: currentPassword
      })
      if (verifyError) {
        throw new Error("Current password is incorrect.")
      }

      // 3. Update to new password
      const { error } = await supabase.auth.updateUser({ password })
      if (error) throw error

      setSuccess(true)
      setCurrentPassword('')
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
      </div>

      <div className="stage-body" style={{ maxWidth: 500, margin: '24px auto' }}>
        <div className="card" style={{ padding: 40, background: 'var(--bg-modal)', textAlign: 'center' }}>
          
          {/* Identity Section */}
          <div style={{ marginBottom: 32, padding: '20px', background: 'rgba(255,255,255,0.03)', borderRadius: 16, border: '1px solid var(--border)' }}>
            <div style={{ 
              width: 48, height: 48, borderRadius: '50%', 
              background: 'var(--accent)', color: '#000',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 12px', fontSize: 20, fontWeight: 900
            }}>
              {userEmail?.[0]?.toUpperCase() || '?'}
            </div>
            <div style={{ fontSize: 14, fontWeight: 800, color: 'var(--text)' }}>Active Identity</div>
            <div style={{ fontSize: 13, color: 'var(--accent)', fontWeight: 600, marginTop: 4 }}>{userEmail}</div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, marginTop: 12, fontSize: 9, background: 'rgba(255,255,255,0.05)', padding: '4px 10px', borderRadius: 20, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 1 }}>
              <CheckCircle2 size={10} color="var(--s-approved)" /> Verified Session
            </div>
          </div>

          <h2 style={{ fontSize: 22, fontWeight: 900, marginBottom: 8 }}>Password Security</h2>
          <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 28, lineHeight: 1.6 }}>
            Update your credentials. Changes take effect on your next sign-in.
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

            <div className="form-group" style={{ marginBottom: 24, paddingBottom: 24, borderBottom: '1px solid var(--border)' }}>
              <label className="form-label">Current Password</label>
              <div style={{ position: 'relative' }}>
                <Lock size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input 
                  type="password" 
                  className="form-input" 
                  style={{ paddingLeft: 38 }}
                  placeholder="••••••••"
                  value={currentPassword}
                  onChange={e => setCurrentPassword(e.target.value)}
                  required 
                />
              </div>
            </div>

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
