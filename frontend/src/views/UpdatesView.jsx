import React from 'react'

export default function UpdatesView() {
  return (
    <div className="view-container">
      <div className="top-bar">
        <span className="top-bar-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 12 20 22 4 22 4 12"></polyline><rect x="2" y="7" width="20" height="5"></rect><line x1="12" y1="22" x2="12" y2="7"></line><path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z"></path><path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z"></path></svg>
          Release Notes
        </span>
      </div>

      <div className="stage-body" style={{ padding: '40px' }}>
        <div style={{ maxWidth: 800, margin: '0 auto' }}>

          <div style={{ marginBottom: 40 }}>
            <h1 style={{ fontSize: 32, fontWeight: 900, marginBottom: 8, letterSpacing: '-1px' }}>What's New</h1>
            <p style={{ color: 'var(--text-muted)' }}>Latest updates, features, and improvements to Submittal Tracker Pro.</p>
          </div>

          <div className="card" style={{ padding: 40, border: '1px solid var(--border)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
              <h2 style={{ fontSize: 24, fontWeight: 800, color: 'var(--accent)' }}>Version 1.0 is Live!</h2>
              <span style={{ fontSize: 14, color: 'var(--text-muted)', background: 'var(--bg-overlay)', padding: '4px 12px', borderRadius: 100 }}>October 2026</span>
            </div>
            
            <div style={{ color: 'var(--text-main)', lineHeight: 1.6 }}>
              <p style={{ marginBottom: 16 }}>Welcome to the official Version 1.0 release. We've added powerful new tools to help you eliminate Excel spreadsheets and track submittals faster than ever.</p>
              
              <h3 style={{ fontSize: 16, fontWeight: 800, color: '#fff', marginTop: 24, marginBottom: 8 }}>✨ Spec Intel Hub (AI Auto-Parser)</h3>
              <p style={{ marginBottom: 16 }}>Stop typing out submittal registers manually. You can now drag and drop a 100-page PDF Spec Book directly into the Spec Intel tab. Our AI instantly extracts every CSI division and builds your register for you.</p>

              <h3 style={{ fontSize: 16, fontWeight: 800, color: '#fff', marginTop: 24, marginBottom: 8 }}>⚡️ 1-Click Excel Backups</h3>
              <p style={{ marginBottom: 16 }}>You can now click the "Excel" button at the top of your workbench to instantly download a perfectly formatted <code>.xlsx</code> file of your entire active project log.</p>

              <h3 style={{ fontSize: 16, fontWeight: 800, color: '#fff', marginTop: 24, marginBottom: 8 }}>👥 Advanced Team Management</h3>
              <p style={{ marginBottom: 16 }}>You can now safely invite Subcontractors and Suppliers to your projects as "Guests". They will only see the projects you invite them to, and they cannot access your company billing or settings.</p>

            </div>
          </div>

        </div>
      </div>
    </div>
  )
}
