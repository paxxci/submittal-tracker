import React, { useState } from 'react'

export default function BillingView({ organization, isGlobalAdmin }) {
  const [loading, setLoading] = useState(false)

  const handleCheckout = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/create-checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          organizationId: organization.id,
          returnUrl: window.location.origin
        })
      })
      const data = await res.json()
      if (data.url) {
        window.location.href = data.url
      }
    } catch (err) {
      console.error(err)
      alert('Failed to start checkout')
    }
    setLoading(false)
  }

  const handlePortal = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/create-portal-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          organizationId: organization.id,
          returnUrl: window.location.origin
        })
      })
      const data = await res.json()
      if (data.url) {
        window.location.href = data.url
      }
    } catch (err) {
      console.error(err)
      alert('Failed to open billing portal')
    }
    setLoading(false)
  }

  const isTrialExpired = organization?.subscription_status === 'trialing' && (new Date() - new Date(organization?.created_at)) > 30 * 24 * 60 * 60 * 1000
  const isPastDue = organization?.subscription_status === 'past_due' || organization?.subscription_status === 'canceled' || isTrialExpired
  const isTrialing = organization?.subscription_status === 'trialing'
  const isActive = organization?.subscription_status === 'active'

  return (
    <div className="view-container">
      <div className="top-bar">
        <span className="top-bar-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="1" y="4" width="22" height="16" rx="2" ry="2"></rect><line x1="1" y1="10" x2="23" y2="10"></line></svg>
          Billing & Subscription
        </span>
      </div>

      <div className="stage-body" style={{ padding: '40px' }}>
        <div style={{ maxWidth: 800, margin: '0 auto' }}>

          <div style={{ marginBottom: 32 }}>
            <h1 style={{ fontSize: 32, fontWeight: 900, marginBottom: 8, letterSpacing: '-1px' }}>Billing & Subscription</h1>
            <p style={{ color: 'var(--text-muted)' }}>Manage your organization\'s subscription plan and payment methods.</p>
          </div>

          <div className="card" style={{ padding: 40, border: '1px solid var(--border)' }}>
            
            {isPastDue && (
              <div style={{ background: 'rgba(239,68,68,0.1)', color: 'var(--s-rejected)', padding: 16, borderRadius: 8, marginBottom: 32, border: '1px solid rgba(239,68,68,0.2)' }}>
                <strong style={{ display: 'block', marginBottom: 4 }}>Action Required:</strong> 
                Your subscription or 30-day free trial has expired. Please subscribe to instantly unlock your projects.
              </div>
            )}
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 32 }}>
              <div>
                <h2 style={{ fontSize: 24, fontWeight: 800, marginBottom: 8 }}>Flat Company License</h2>
                <div style={{ fontSize: 14, color: 'var(--text-sub)' }}>
                  <strong style={{ color: 'var(--text)', fontSize: 18 }}>$199</strong> / month — Unlimited Users & Projects.
                </div>
              </div>
              <div style={{ padding: '6px 16px', background: isActive ? 'rgba(34,197,94,0.1)' : 'var(--bg-overlay)', color: isActive ? 'var(--s-approved)' : 'var(--text-main)', borderRadius: 100, fontSize: 12, fontWeight: 800, textTransform: 'uppercase', letterSpacing: 1 }}>
                Status: {organization?.subscription_status || 'trialing'}
              </div>
            </div>

            <div style={{ marginTop: 40, paddingTop: 32, borderTop: '1px solid var(--border)' }}>
              {!organization?.stripe_customer_id || isTrialing ? (
                <button className="btn btn-primary" onClick={handleCheckout} disabled={loading} style={{ width: '100%', padding: '16px', fontSize: 16, justifyContent: 'center' }}>
                  {loading ? 'Loading...' : 'Subscribe Now'}
                </button>
              ) : (
                <button className="btn btn-ghost" onClick={handlePortal} disabled={loading} style={{ width: '100%', padding: '16px', fontSize: 16, justifyContent: 'center', border: '1px solid var(--border)' }}>
                  {loading ? 'Loading...' : 'Manage Billing & Payment Method'}
                </button>
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}
