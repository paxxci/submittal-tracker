import React, { useState, useEffect } from 'react'
import { LogIn, UserPlus, Shield, ArrowRight, Mail, Lock, BadgeCheck, RotateCcw } from 'lucide-react'
import { supabase } from '../supabase_client'

const MODE_LOGIN = 'login'
const MODE_SIGNUP = 'signup'
const MODE_FORGOT = 'forgot'
const MODE_RESET = 'reset'

export default function Login({ initialMode = MODE_LOGIN, onComplete }) {
  const [mode, setMode] = useState(initialMode)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(false)
  const [message, setMessage] = useState(null)
  const [signupCode, setSignupCode] = useState('')

  useEffect(() => {
    // 1. Check for URL Parameters (Invitations & Errors)
    const params = new URLSearchParams(window.location.search)
    const hashParams = new URLSearchParams(window.location.hash.substring(1))
    
    // Check for Errors (like expired links)
    const errorCode = params.get('error_code') || hashParams.get('error_code')
    
    if (errorCode === 'otp_expired' || errorCode === 'access_denied') {
      setError("Your recovery link has expired or has already been used. Please request a new one below.")
      setMode(MODE_FORGOT)
    } else {
      // If we are in initialMode 'reset' (passed from App.jsx), keep it
      if (initialMode === MODE_RESET) {
        setMode(MODE_RESET)
      }
    }

    if (params.get('signup') === 'true') {
      setMode(MODE_SIGNUP)
    }
    const inviteEmail = params.get('email')
    if (inviteEmail) {
      setEmail(inviteEmail)
    }

    // 2. Listen for Password Recovery events from Supabase links
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'PASSWORD_RECOVERY' || event === 'USER_UPDATED') {
        const hash = window.location.hash
        if (hash.includes('type=recovery') || hash.includes('type=invite')) {
          setMode(MODE_RESET)
        }
      }
    })
    
    // 3. One-time hash check for direct redirection
    if (window.location.hash.includes('type=recovery') || window.location.hash.includes('type=invite')) {
      setMode(MODE_RESET)
    }
    
    return () => subscription.unsubscribe()
  }, [initialMode])

  const [isInvited, setIsInvited] = useState(false)
  const [checkingInvite, setCheckingInvite] = useState(false)

  const checkInviteStatus = async (emailToCheck) => {
    if (!emailToCheck || !emailToCheck.includes('@')) {
      setIsInvited(false)
      return
    }
    
    try {
      setCheckingInvite(true)
      const { data, error } = await supabase.rpc('check_invitation', { email_text: emailToCheck })
      
      setIsInvited(!!data)
    } catch (err) {
      console.error('Invite check failed:', err)
    } finally {
      setCheckingInvite(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setMessage(null)

    try {
      if (mode === MODE_LOGIN) {
        const { error } = await supabase.auth.signInWithPassword({ email, password })
        if (error) throw error
      } 
      else if (mode === MODE_SIGNUP) {
        // 1. If NOT invited, they MUST have a valid, unredeemed License Key
        if (!isInvited) {
          const formattedCode = (signupCode || '').trim().toUpperCase()
          if (!formattedCode) throw new Error("A License Key is required to create a new island.")

          const { data: keyData, error: keyError } = await supabase
            .from('onboarding_keys')
            .select('*')
            .eq('key_code', formattedCode)
            .eq('is_redeemed', false)
            .maybeSingle()
          
          if (keyError || !keyData) {
            throw new Error(`Invalid Key: "${formattedCode}" is not recognized or has already been used.`)
          }
        }

        const { error } = await supabase.auth.signUp({ 
          email, 
          password,
          options: { 
            emailRedirectTo: window.location.origin,
            data: { 
              signup_code: isInvited ? null : signupCode // Only store if they actually used one
            }
          }
        })
        if (error) throw error
        setSuccess(true)
      }
      else if (mode === MODE_FORGOT) {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: window.location.origin,
        })
        if (error) throw error
        setMessage("Recovery link sent! Check your inbox.")
      }
      else if (mode === MODE_RESET) {
        const { error } = await supabase.auth.updateUser({ password })
        if (error) throw error
        setMessage("Password updated! Logging you in...")
        setTimeout(() => {
          if (onComplete) onComplete()
        }, 1500)
      }
    } catch (err) {
      if (err.message.toLowerCase().includes('rate limit')) {
        setError("Security Cooldown: Please wait a few minutes before trying again.")
      } else {
        setError(err.message)
      }
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="login-container">
        <div className="login-card success-card">
          <div className="login-icon success-icon">
            <Mail size={32} />
          </div>
          <h2>Check your email</h2>
          <p>We've sent a verification link to <strong>{email}</strong>. Once verified, you can log in to your dashboard.</p>
          <button className="btn btn-primary" onClick={() => { setSuccess(false); setMode(MODE_LOGIN); }}>
            Back to Login
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="login-container">
      <div className="login-visual">
        <div className="visual-content">
          <div className="logo-section">
            <div className="logo-box">
              <Shield size={24} color="var(--accent)" />
            </div>
            <span className="logo-text">Submittal Tracker <span className="text-accent">Pro</span></span>
          </div>
          <h1>Professional <br /><span className="text-accent">Submittal Tracker.</span></h1>
          <p>Professional grade tracking, PDF reporting, and team coordination in one beautiful interface.</p>
          
          <div className="feature-list">
            <div className="feature-item">
              <BadgeCheck size={18} className="text-accent" />
              <span>Automated Spec Breakdown</span>
            </div>
            <div className="feature-item">
              <BadgeCheck size={18} className="text-accent" />
              <span>Full Activity Paper Trail</span>
            </div>
            <div className="feature-item">
              <BadgeCheck size={18} className="text-accent" />
              <span>Clean & Simple Dashboard</span>
            </div>
          </div>
        </div>
        <div className="visual-overlay" />
      </div>

      <div className="login-form-side">
        <div className="login-card">
          <div className="login-header">
            <h2>
              {mode === MODE_LOGIN && 'Welcome Back'}
              {mode === MODE_SIGNUP && 'Create Account'}
              {mode === MODE_FORGOT && 'Reset Password'}
              {mode === MODE_RESET && 'Welcome to the Team'}
            </h2>
            <p>
              {mode === MODE_LOGIN && 'Sign in to access your projects'}
              {mode === MODE_SIGNUP && 'Start tracking your submittals today'}
              {mode === MODE_FORGOT && "Enter your email to get a recovery link"}
              {mode === MODE_RESET && 'Set a secure password to activate your account'}
            </p>
          </div>

          <form onSubmit={handleSubmit}>
            {error && <div className="login-error"><p>{error}</p></div>}
            {message && <div className="login-success"><p>{message}</p></div>}
            
            {mode !== MODE_RESET && (
              <div className="input-group">
                <label>Email Address</label>
                <div className="input-wrapper">
                  <Mail size={18} className="input-icon" />
                  <input 
                    type="email" 
                    value={email} 
                    onChange={e => {
                      setEmail(e.target.value)
                      if (mode === MODE_SIGNUP) checkInviteStatus(e.target.value)
                    }} 
                    placeholder="name@company.com" 
                    required 
                  />
                  {checkingInvite && <div className="input-spinner" />}
                </div>
              </div>
            )}

            {mode !== MODE_FORGOT && (
              <div className="input-group">
                <label>{mode === MODE_RESET ? 'New Password' : 'Password'}</label>
                <div className="input-wrapper">
                  <Lock size={18} className="input-icon" />
                  <input 
                    type="password" 
                    value={password} 
                    onChange={e => setPassword(e.target.value)} 
                    placeholder="••••••••" 
                    required 
                  />
                </div>
              </div>
            )}

            {mode === MODE_SIGNUP && !isInvited && (
              <div className="input-group" style={{ marginTop: '-4px', marginBottom: '24px' }}>
                <label>Company Onboarding Code</label>
                <div className="input-wrapper">
                  <Shield size={18} className="input-icon" />
                  <input 
                    type="text" 
                    value={signupCode} 
                    onChange={e => setSignupCode(e.target.value.toUpperCase())} 
                    placeholder="Enter Private Code" 
                    id="input-signup-code"
                  />
                </div>
                <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>
                  Required to create a new company island.
                </p>
              </div>
            )}

            {mode === MODE_SIGNUP && isInvited && (
               <div className="animate-in" style={{ 
                    padding: '12px 16px', borderRadius: 12, background: 'rgba(34, 197, 94, 0.1)', 
                    border: '1px solid rgba(34, 197, 94, 0.2)', color: '#22c55e', fontSize: 13, marginBottom: 24,
                    display: 'flex', alignItems: 'center', gap: 12
                }}>
                  <BadgeCheck size={20} />
                  <div>
                    <strong>VIP Invitation Found!</strong>
                    <div style={{ opacity: 0.8, fontSize: 11 }}>No onboarding code required for team members.</div>
                  </div>
               </div>
            )}

            <button type="submit" className="btn btn-primary login-btn" disabled={loading}>
              {loading ? 'Processing...' : (
                mode === MODE_LOGIN ? 'Sign In' : 
                mode === MODE_SIGNUP ? 'Create Account' : 
                mode === MODE_FORGOT ? 'Send Link' : 'Update Password'
              )}
              {!loading && <ArrowRight size={18} />}
            </button>
          </form>

          <div className="login-footer">
            {mode === MODE_LOGIN && (
              <>
                <p>Don't have an account? <button className="btn-link" onClick={() => setMode(MODE_SIGNUP)}>Sign Up</button></p>
                <button className="btn-link forgot-link" onClick={() => setMode(MODE_FORGOT)}>Forgot your password?</button>
              </>
            )}
            {mode === MODE_SIGNUP && (
              <p>Already have an account? <button className="btn-link" onClick={() => setMode(MODE_LOGIN)}>Sign In</button></p>
            )}
            {(mode === MODE_FORGOT || mode === MODE_RESET) && (
              <button className="btn-link" onClick={() => setMode(MODE_LOGIN)}>Back to Sign In</button>
            )}
          </div>
        </div>
      </div>

      <style>{`
        .login-container {
          display: flex;
          height: 100vh;
          background: var(--bg-base);
          color: var(--text-main);
        }

        .login-visual {
          flex: 1.2;
          position: relative;
          background: url('https://images.unsplash.com/photo-1541888946425-d81bb19240f5?auto=format&fit=crop&q=80&w=2000') center/cover no-repeat;
          display: flex;
          align-items: center;
          padding: 60px;
        }

        .visual-overlay {
          position: absolute;
          inset: 0;
          background: linear-gradient(135deg, rgba(7, 13, 26, 0.95) 0%, rgba(7, 13, 26, 0.7) 100%);
          z-index: 1;
        }

        .visual-content {
          position: relative;
          z-index: 2;
          max-width: 600px;
        }

        .logo-section {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 40px;
        }

        .logo-box {
          width: 40px;
          height: 40px;
          background: rgba(14, 165, 233, 0.1);
          border: 1px solid rgba(14, 165, 233, 0.2);
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 10px;
        }

        .logo-text {
          font-weight: 700;
          font-size: 1.2rem;
          letter-spacing: -0.02em;
        }

        .text-accent {
          color: var(--accent);
        }

        .visual-content h1 {
          font-size: 3.5rem;
          line-height: 1.1;
          margin-bottom: 24px;
          letter-spacing: -0.03em;
        }

        .visual-content p {
          font-size: 1.1rem;
          color: var(--text-sub);
          line-height: 1.6;
          margin-bottom: 40px;
        }

        .feature-list {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .feature-item {
          display: flex;
          align-items: center;
          gap: 12px;
          font-size: 0.95rem;
          color: var(--text-sub);
        }

        .login-form-side {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 40px;
          background: var(--bg-card);
          border-left: 1px solid var(--border);
        }

        .login-card {
          width: 100%;
          max-width: 420px;
        }

        .login-header {
          margin-bottom: 32px;
        }

        .login-header h2 {
          font-size: 2rem;
          margin-bottom: 8px;
        }

        .login-header p {
          color: var(--text-sub);
          font-size: 0.95rem;
        }

        .input-group {
          margin-bottom: 20px;
        }

        .input-group label {
          display: block;
          font-size: 0.85rem;
          font-weight: 500;
          margin-bottom: 8px;
          color: var(--text-sub);
        }

        .input-wrapper {
          position: relative;
          display: flex;
          align-items: center;
        }

        .input-icon {
          position: absolute;
          left: 14px;
          color: var(--text-muted);
        }

        .input-wrapper input {
          width: 100%;
          padding: 12px 12px 12px 42px;
          background: var(--bg-base);
          border: 1px solid var(--border);
          border-radius: 8px;
          color: var(--text-main);
          font-size: 0.95rem;
          transition: all 0.2s;
        }

        .input-wrapper input:focus {
          outline: none;
          border-color: var(--accent);
          box-shadow: 0 0 0 3px rgba(14, 165, 233, 0.1);
        }

        .login-btn {
          width: 100%;
          padding: 14px;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          font-weight: 600;
          margin-top: 12px;
        }

        .login-error {
          background: rgba(239, 68, 68, 0.1);
          border: 1px solid rgba(239, 68, 68, 0.2);
          color: #ef4444;
          padding: 12px;
          border-radius: 8px;
          font-size: 0.9rem;
          margin-bottom: 20px;
        }

        .login-success {
          background: rgba(16, 185, 129, 0.1);
          border: 1px solid rgba(16, 185, 129, 0.2);
          color: #10b981;
          padding: 12px;
          border-radius: 8px;
          font-size: 0.9rem;
          margin-bottom: 20px;
        }

        .login-footer {
          margin-top: 24px;
          text-align: center;
          font-size: 0.9rem;
          color: var(--text-sub);
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .btn-link {
          background: none;
          border: none;
          color: var(--accent);
          font-weight: 600;
          margin-left: 6px;
          cursor: pointer;
        }

        .forgot-link {
          font-size: 0.85rem;
          color: var(--text-muted);
          font-weight: 500;
        }

        .success-card {
          text-align: center;
          padding: 40px;
          background: var(--bg-card);
          border: 1px solid var(--border);
          border-radius: 20px;
        }

        .success-icon {
          width: 64px;
          height: 64px;
          background: rgba(16, 185, 129, 0.1);
          color: #10b981;
          margin: 0 auto 24px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 50%;
        }

        @media (max-width: 1024px) {
          .login-visual { display: none; }
          .login-form-side { border-left: none; }
        }
      `}</style>
    </div>
  )
}
