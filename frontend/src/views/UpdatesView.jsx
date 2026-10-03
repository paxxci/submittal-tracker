import React from 'react'

export default function UpdatesView() {
  return (
    <div className="view-container" style={{ overflowY: 'auto' }}>
      <div className="top-bar">
        <span className="top-bar-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 12 20 22 4 22 4 12"></polyline><rect x="2" y="7" width="20" height="5"></rect><line x1="12" y1="22" x2="12" y2="7"></line><path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z"></path><path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z"></path></svg>
          Quick Start & Features
        </span>
      </div>

      <div className="stage-body" style={{ padding: '40px', paddingBottom: '100px' }}>
        <div style={{ maxWidth: 800, margin: '0 auto' }}>

          <div style={{ marginBottom: 40 }}>
            <h1 style={{ fontSize: 32, fontWeight: 900, marginBottom: 8, letterSpacing: '-1px' }}>Version 1.0 Release Guide</h1>
            <p style={{ color: 'var(--text-muted)' }}>Welcome to Submittal Tracker Pro. Built specifically for the construction industry, this platform eliminates the chaos of Excel spreadsheets, lost emails, and missed deadlines.</p>
          </div>

          {/* QUICK START */}
          <div className="card" style={{ padding: 40, border: '1px solid var(--border)', marginBottom: 24 }}>
            <h2 style={{ fontSize: 24, fontWeight: 800, color: 'var(--accent)', marginBottom: 24 }}>Part 1: Quick Start Workflow</h2>
            <p style={{ color: 'var(--text-sub)', marginBottom: 24 }}>If you are starting a brand new project, follow these 4 steps:</p>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              <div>
                <strong style={{ color: '#fff', fontSize: 16 }}>1. Create a Project:</strong>
                <p style={{ color: 'var(--text-main)', marginTop: 4 }}>On your main dashboard, click "+ New Project". Fill in your Project Number, Client Name, and Address.</p>
              </div>
              <div>
                <strong style={{ color: '#fff', fontSize: 16 }}>2. Build Your Log:</strong>
                <p style={{ color: 'var(--text-main)', marginTop: 4 }}>Click into your new project and hit the <strong>Spec Intel</strong> button. You can either drag-and-drop a PDF Spec Book for the AI to read, or drop an existing Excel/CSV file into the "Bulk Register Lane" to instantly populate your log.</p>
              </div>
              <div>
                <strong style={{ color: '#fff', fontSize: 16 }}>3. Invite Your Team:</strong>
                <p style={{ color: 'var(--text-main)', marginTop: 4 }}>Click the <strong>Team Management</strong> icon on the left sidebar. Type in the email of your Supplier or Subcontractor, select "Guest", and hit invite.</p>
              </div>
              <div>
                <strong style={{ color: '#fff', fontSize: 16 }}>4. Start Tracking:</strong>
                <p style={{ color: 'var(--text-main)', marginTop: 4 }}>Open a submittal, assign the "Ball in Court" to your Supplier, and set a Due Date. You're officially tracking!</p>
              </div>
            </div>
          </div>

          {/* FEATURES */}
          <div className="card" style={{ padding: 40, border: '1px solid var(--border)' }}>
            <h2 style={{ fontSize: 24, fontWeight: 800, color: '#fff', marginBottom: 32 }}>Part 2: Core Features & Navigation</h2>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: 32, color: 'var(--text-main)' }}>
              
              <div>
                <h3 style={{ fontSize: 18, fontWeight: 800, color: 'var(--accent)', marginBottom: 8 }}>The Project Dashboard</h3>
                <p style={{ marginBottom: 8 }}>When you log in, you will see a high-level overview of every active workspace.</p>
                <ul style={{ paddingLeft: 20, listStyleType: 'disc' }}>
                  <li><strong>Analytics at a Glance:</strong> Instantly see your overall completion percentage, total approved items, and exactly how many items are overdue across all jobs.</li>
                </ul>
              </div>

              <div>
                <h3 style={{ fontSize: 18, fontWeight: 800, color: 'var(--accent)', marginBottom: 8 }}>The Core Workbench</h3>
                <p style={{ marginBottom: 8 }}>Your daily control center inside a project.</p>
                <ul style={{ paddingLeft: 20, listStyleType: 'disc', display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <li><strong>Ball-in-Court Logic:</strong> The grid clearly displays exactly whose desk a submittal is sitting on.</li>
                  <li><strong>Smart Filtering:</strong> Click a single button at the top to filter the grid to view only "Overdue" items or items currently "In Review."</li>
                  <li><strong>Add Manual Items:</strong> Need to track a one-off item? Just click "Add Submittal" at the top right to instantly create a new row.</li>
                </ul>
              </div>

              <div>
                <h3 style={{ fontSize: 18, fontWeight: 800, color: 'var(--accent)', marginBottom: 8 }}>Spec Intel Hub (AI Auto-Parser)</h3>
                <p style={{ marginBottom: 8 }}>Stop manually typing out submittal registers.</p>
                <ul style={{ paddingLeft: 20, listStyleType: 'disc', display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <li><strong>AI Extraction:</strong> Our Gemini-powered AI scans the Table of Contents of a 100-page PDF and extracts every single CSI Division and Section in seconds.</li>
                  <li><strong>One-Click Import:</strong> Check the boxes for the divisions your company is responsible for, and the software will instantly generate your entire submittal register.</li>
                </ul>
              </div>

              <div>
                <h3 style={{ fontSize: 18, fontWeight: 800, color: 'var(--accent)', marginBottom: 8 }}>Spec Intel Assistant (AI Chat)</h3>
                <p style={{ marginBottom: 8 }}>Meet your new Project Engineer.</p>
                <ul style={{ paddingLeft: 20, listStyleType: 'disc', display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <li><strong>Project Context:</strong> The AI reads and memorizes every single document, revision, and status across your entire project.</li>
                  <li><strong>Instant Answers:</strong> Ask the chat, <em>"What revision of the light fixtures was approved, and when?"</em> and get an instant, perfectly accurate answer based on your project data.</li>
                </ul>
              </div>

              <div>
                <h3 style={{ fontSize: 18, fontWeight: 800, color: 'var(--accent)', marginBottom: 8 }}>Document Control & Versioning</h3>
                <p style={{ marginBottom: 8 }}>Never attach the wrong PDF to an email again.</p>
                <ul style={{ paddingLeft: 20, listStyleType: 'disc', display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <li><strong>Auto-Versioning:</strong> When you upload a new PDF for an item, the software automatically bumps it to "Revision 2" and archives the old version.</li>
                  <li><strong>O&M Manuals:</strong> Upload Operations & Maintenance manuals or reference files independently of your submittal revisions.</li>
                  <li><strong>Digital Stamping:</strong> Click a single button to permanently stamp an uploaded PDF as "Officially Approved."</li>
                </ul>
              </div>

              <div>
                <h3 style={{ fontSize: 18, fontWeight: 800, color: 'var(--accent)', marginBottom: 8 }}>The Immutable Audit Trail</h3>
                <p style={{ marginBottom: 8 }}>Total legal protection for your company.</p>
                <ul style={{ paddingLeft: 20, listStyleType: 'disc' }}>
                  <li><strong>Automated Tracking:</strong> Every time a user uploads a file, changes a status, or updates a due date, the system permanently logs the exact time, date, and user who made the change.</li>
                </ul>
              </div>

              <div>
                <h3 style={{ fontSize: 18, fontWeight: 800, color: 'var(--accent)', marginBottom: 8 }}>Reporting & Closeout</h3>
                <p style={{ marginBottom: 8 }}>Generate professional deliverables in seconds.</p>
                <ul style={{ paddingLeft: 20, listStyleType: 'disc', display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <li><strong>Excel Backups:</strong> One click on the top "Excel" button instantly downloads your entire active workbench as a fully formatted Microsoft Excel spreadsheet.</li>
                  <li><strong>PDF Logs:</strong> Generate a highly-branded, executive-summary PDF of your project log for OAC meetings.</li>
                  <li><strong>The Zip Closeout:</strong> When the job is done, go to Project Settings and click "Export Approved Package" to automatically bundle all your Approved PDFs and your final digital log into a single ZIP file for the General Contractor.</li>
                </ul>
              </div>

              <div>
                <h3 style={{ fontSize: 18, fontWeight: 800, color: 'var(--accent)', marginBottom: 8 }}>Team Collaboration & Permissions (RBAC)</h3>
                <ul style={{ paddingLeft: 20, listStyleType: 'disc', display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <li><strong>Admins:</strong> Have full access to create projects, remove users, and manage company billing.</li>
                  <li><strong>Members (Employees):</strong> Can manage projects and approve submittals, but cannot access your Billing Tab.</li>
                  <li><strong>Guests (Subcontractors/Suppliers):</strong> Can only view the specific projects you invite them to. They cannot see your other projects or access company billing.</li>
                </ul>
              </div>

            </div>
          </div>

        </div>
      </div>
    </div>
  )
}
