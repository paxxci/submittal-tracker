import React, { useState } from 'react'
import { Mail, ExternalLink, Star, Trash2, ChevronDown, ChevronUp, CheckSquare } from 'lucide-react'

function AccordionSection({ id, title, defaultOpen = false, currentOpen, setOpen, children, highlight = false }) {
  const isOpen = currentOpen === id
  const toggle = () => setOpen(isOpen ? null : id)
  
  return (
    <div className="card" style={{ 
      border: highlight ? '1px solid var(--accent)' : '1px solid var(--border)', 
      marginBottom: 24, 
      background: highlight ? 'rgba(0, 180, 216, 0.05)' : 'var(--bg-panel)',
      overflow: 'hidden'
    }}>
      <div 
        onClick={toggle}
        style={{ 
          padding: '24px 40px', 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          cursor: 'pointer',
          userSelect: 'none'
        }}
      >
        <h2 style={{ fontSize: 24, fontWeight: 800, color: highlight ? 'var(--accent)' : '#fff', margin: 0 }}>{title}</h2>
        <div style={{ color: highlight ? 'var(--accent)' : 'var(--text-muted)' }}>
          {isOpen ? <ChevronUp size={24} /> : <ChevronDown size={24} />}
        </div>
      </div>
      
      {isOpen && (
        <div style={{ padding: '0 40px 40px 40px' }}>
          {children}
        </div>
      )}
    </div>
  )
}

export default function UpdatesView() {
  const [openSection, setOpenSection] = useState('quickstart')

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
            <h1 style={{ fontSize: 32, fontWeight: 900, marginBottom: 8, letterSpacing: '-1px' }}>Submittal Tracker Pro Updates</h1>
            <p style={{ color: 'var(--text-muted)' }}>Welcome to Submittal Tracker Pro. Built specifically for the construction industry, this platform eliminates the chaos of Excel spreadsheets, lost emails, and missed deadlines.</p>
          </div>

          <AccordionSection 
            id="quickstart" 
            title="Quick Start Workflow" 
            currentOpen={openSection} 
            setOpen={setOpenSection}
            highlight={true}
          >
            <p style={{ color: 'var(--text-sub)', marginBottom: 24, marginTop: 16 }}>If you are starting a brand new project, follow these 4 steps:</p>
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
          </AccordionSection>

          <AccordionSection 
            id="help" 
            title="Need Help or Have a Suggestion?" 
            currentOpen={openSection} 
            setOpen={setOpenSection}
          >
            <p style={{ color: 'var(--text-main)', marginBottom: 24, lineHeight: 1.6, marginTop: 16 }}>
              We are constantly building new features based on feedback from Project Managers like you. If you run into an issue, need help, or want to suggest a new feature, email the founder directly at:
            </p>
            <a href="mailto:submittaltrackerpro@gmail.com" style={{ display: 'inline-block', background: 'var(--accent)', color: '#000', padding: '12px 24px', borderRadius: '8px', fontWeight: 'bold', textDecoration: 'none' }}>
              Email Support
            </a>
          </AccordionSection>

          <AccordionSection 
            id="v1.1" 
            title="Version 1.1: Email & Release Workflow" 
            currentOpen={openSection} 
            setOpen={setOpenSection}
          >
            <div style={{ display: 'flex', flexDirection: 'column', gap: 24, color: 'var(--text-main)', marginTop: 16 }}>
              <div>
                <h3 style={{ fontSize: 18, fontWeight: 800, color: '#fff', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}><Mail size={18} color="#3b82f6" /> The Smart Email Button</h3>
                <p style={{ marginBottom: 12, lineHeight: 1.6 }}>
                  Every document now features a single Blue Envelope icon. Clicking this icon opens our new Smart Email Window, allowing you to instantly email the PDF directly from the app without opening Outlook.
                </p>
                <ul style={{ paddingLeft: 20, listStyleType: 'disc', display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <li style={{ lineHeight: 1.5 }}><strong>Standard Sharing:</strong> For any normal document, you can type an email address, add a message, and share it. It will securely send the document and permanently log the action in the Audit Trail.</li>
                  <li style={{ lineHeight: 1.5 }}><strong>Official Release to Manufacturing:</strong> If a document has been officially stamped as "Approved," the Smart Email Window will reveal a green <strong>"Official Release to manufacturing"</strong> checkbox. Checking this box will send the email <em>and</em> automatically upgrade the submittal's master status to <span style={{ color: '#10b981', fontWeight: 700 }}>Approved & Released</span>.</li>
                </ul>
              </div>

              <div style={{ borderTop: '1px solid rgba(0,180,216,0.2)', paddingTop: 24 }}>
                <h3 style={{ fontSize: 18, fontWeight: 800, color: '#fff', marginBottom: 16 }}>Document Icons Reference Guide</h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 16 }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16 }}>
                    <div style={{ width: 36, height: 36, flexShrink: 0, background: 'rgba(255,255,255,0.05)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <ExternalLink size={16} color="var(--text-muted)" />
                    </div>
                    <div>
                      <strong style={{ color: '#fff', display: 'block', marginBottom: 4 }}>Open Link</strong>
                      <span style={{ fontSize: 13, lineHeight: 1.4 }}>Opens the PDF in a new secure browser tab for viewing, downloading, or printing.</span>
                    </div>
                  </div>
                  
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16 }}>
                    <div style={{ width: 36, height: 36, flexShrink: 0, background: 'rgba(59, 130, 246, 0.15)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Mail size={16} color="#3b82f6" />
                    </div>
                    <div>
                      <strong style={{ color: '#3b82f6', display: 'block', marginBottom: 4 }}>Share / Email Document</strong>
                      <span style={{ fontSize: 13, lineHeight: 1.4 }}>Opens the Smart Email Window to send a secure link to the document. (Will show Release options if the document is Approved).</span>
                    </div>
                  </div>
                  
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16 }}>
                    <div style={{ width: 36, height: 36, flexShrink: 0, background: 'rgba(255,255,255,0.05)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Star size={16} color="var(--text-muted)" />
                    </div>
                    <div>
                      <strong style={{ color: '#fff', display: 'block', marginBottom: 4 }}>Approve Stamp</strong>
                      <span style={{ fontSize: 13, lineHeight: 1.4 }}>Stamps the document as the "Officially Approved Version", turning the document green and unlocking the Official Release email checkbox. Clicking the star again revokes the approval and downgrades the submittal.</span>
                    </div>
                  </div>
                  
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16 }}>
                    <div style={{ width: 36, height: 36, flexShrink: 0, background: 'rgba(239, 68, 68, 0.15)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Trash2 size={16} color="var(--s-rejected)" />
                    </div>
                    <div>
                      <strong style={{ color: 'var(--s-rejected)', display: 'block', marginBottom: 4 }}>Delete Document</strong>
                      <span style={{ fontSize: 13, lineHeight: 1.4 }}>Permanently deletes the document from the system and logs the deletion action in the master Audit Trail.</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </AccordionSection>

          <AccordionSection 
            id="v1.0" 
            title="Version 1.0: Core Features" 
            currentOpen={openSection} 
            setOpen={setOpenSection}
          >
            <div style={{ display: 'flex', flexDirection: 'column', gap: 32, color: 'var(--text-main)', marginTop: 16 }}>
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
                <h3 style={{ fontSize: 18, fontWeight: 800, color: 'var(--accent)', marginBottom: 8 }}>Document Control & Versioning</h3>
                <p style={{ marginBottom: 8 }}>Never attach the wrong PDF to an email again.</p>
                <ul style={{ paddingLeft: 20, listStyleType: 'disc', display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <li><strong>Auto-Versioning:</strong> When you upload a new PDF for an item, the software automatically bumps it to "Revision 2" and archives the old version.</li>
                  <li><strong>O&M Manuals:</strong> Upload Operations & Maintenance manuals or reference files independently of your submittal revisions.</li>
                </ul>
              </div>

              <div>
                <h3 style={{ fontSize: 18, fontWeight: 800, color: 'var(--accent)', marginBottom: 8 }}>Reporting & Closeout</h3>
                <p style={{ marginBottom: 8 }}>Generate professional deliverables in seconds.</p>
                <ul style={{ paddingLeft: 20, listStyleType: 'disc', display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <li><strong>Excel Backups:</strong> One click on the top "Excel" button instantly downloads your entire active workbench as a fully formatted Microsoft Excel spreadsheet.</li>
                  <li><strong>The Zip Closeout:</strong> When the job is done, go to Project Settings and click "Export Approved Package" to automatically bundle all your Approved PDFs and your final digital log into a single ZIP file for the General Contractor.</li>
                </ul>
              </div>
            </div>
          </AccordionSection>

        </div>
      </div>
    </div>
  )
}
