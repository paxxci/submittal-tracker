import React, { useState, useRef, useEffect } from 'react'
import { Upload, FileText, ChevronRight, Check, Loader2, Sparkles, AlertCircle, Search, X, Import } from 'lucide-react'
import * as pdfjsLib from 'pdfjs-dist'
import { getSpecSections, createSpecSection, resolveSpecSectionId } from '../services/spec_service'
import { createSubmittal } from '../services/submittal_service'
import { callAI } from '../services/ai'

const ArrowLeft = ({ size }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="m12 19-7-7 7-7"/><path d="M19 12H5"/>
  </svg>
)

const FileSearch = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 22V4c0-.5.2-1 .6-1.4C5 2.2 5.5 2 6 2h8.5L20 7.5V20c0 .5-.2 1-.6 1.4-.4.4-.9.6-1.4.6h-2"/>
    <path d="M14 2v6h6"/><circle cx="8" cy="14" r="4"/><path d="m11 17 3 3"/>
  </svg>
)

// Set worker source (using local bundle for Vite compatibility)
import pdfWorker from 'pdfjs-dist/build/pdf.worker.mjs?url'
pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorker

export default function SpecView({ project, onBack, activeUser }) {
  const [file, setFile] = useState(null)
  const [loading, setLoading] = useState(false)
  const [step, setStep] = useState(1) // 1: Upload, 2: Discovering Sections, 3: Select & Extract, 4: Results
  const [discoveredSections, setDiscoveredSections] = useState([])
  const [selectedIds, setSelectedIds] = useState(new Set())
  const [importing, setImporting] = useState(false)
  const [error, setError] = useState(null)
  
  const fileInputRef = useRef()

  const handleFileChange = (e) => {
    const f = e.target.files?.[0]
    if (f && f.type === 'application/pdf') {
      setFile(f)
      setError(null)
      startDiscovery(f)
    } else {
      setError('Please upload a valid PDF file.')
    }
  }

  const startDiscovery = async (file) => {
    try {
      setLoading(true)
      setStep(2)
      
      const arrayBuffer = await file.arrayBuffer()
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise
      
      // ADAPTIVE SCANNING: For larger files, search up to 30 pages
      const isLargeFile = file.size > 5 * 1024 * 1024 // 5MB
      const scanLimit = isLargeFile ? 40 : 15
      const maxPages = Math.min(pdf.numPages, scanLimit)
      
      let tocText = ''
      let detectedPages = []

      // PHASE 1: KEYWORD SEARCH - Look for 'Table of Contents' or 'Division 26'
      console.log(`Starting adaptive scan of ${maxPages} pages...`)
      
      for (let i = 1; i <= maxPages; i++) {
        const page = await pdf.getPage(i)
        const textContent = await page.getTextContent()
        const strings = textContent.items.map(item => item.str)
        const pageText = strings.join(' ')
        
        const hasTOC = /table\s+of\s+contents|project\s+manual\s+index|division\s+26/i.test(pageText)
        if (hasTOC || i <= 5) {
          tocText += `--- PAGE ${i} ---\n${pageText}\n`
          detectedPages.push(i)
        }
        
        // Stop early if we have enough TOC data (e.g. 15 solid pages)
        if (detectedPages.length >= 20) break 
      }

      console.log(`Extracted text from ${detectedPages.length} smart-sampled pages. Sending to AI...`)
      
      const prompt = `
        You are a construction specification expert. I am providing a text dump from a ${file.name} project index.
        
        GOAL: Extract ALL Divisions and Sections listed in this index (e.g. Div 01, 02, 08, 10, 26, 27, 28, etc.).
        Do not filter by trade; extract everything so the user can choose their responsibility.
        
        Return ONLY a JSON array:
        [
          { "division": "01", "code": "01 10 00", "title": "Summary of Work" },
          { "division": "26", "code": "26 05 19", "title": "Low-Voltage Power Conductors" },
          ...
        ]
        
        Text Data:
        ${tocText.slice(0, 50000)} // Deep scan
      `

      const aiResponse = await callAI(prompt)
      let sections = []
      try {
        // More robust JSON cleaning for different AI response styles
        const cleanJson = aiResponse.replace(/```json|```/g, '').trim()
        const match = cleanJson.match(/\[[\s\S]*\]/)
        sections = JSON.parse(match ? match[0] : cleanJson)
      } catch (err) {
        console.error('AI JSON Parse Error:', err, 'Response was:', aiResponse)
        sections = []
      }

      setDiscoveredSections(sections)
      setStep(3)
    } catch (err) {
      console.error('Discovery failed:', err)
      setError(`Discovery failed: ${err.message}`)
      setStep(1)
    } finally {
      setLoading(false)
    }
  }

  const toggleSection = (id) => {
    const next = new Set(selectedIds)
    if (next.has(id)) next.delete(id)
    else next.add(id)
    setSelectedIds(next)
  }

  const selectAllDiv = (div) => {
    const next = new Set(selectedIds)
    discoveredSections.filter(s => s.division === div).forEach(s => {
      const key = `${s.division}-${s.code}`
      next.add(key)
    })
    setSelectedIds(next)
  }

  const handleImport = async () => {
    try {
      setImporting(true)
      const selected = discoveredSections.filter(s => selectedIds.has(`${s.division}-${s.code}`))
      
      for (const s of selected) {
        // 1. Ensure section exists in DB
        const sectionId = await resolveSpecSectionId(project.id, s.code)
        
        // 2. Mocking deep submittal scan for now (Phase 11.4)
        // IN PRODUCE: We would find the page for this section and extract Part 1.03 Submittals
        await createSubmittal({
          project_id: project.id,
          spec_section_id: sectionId,
          item_name: s.title,
          status: 'not_started',
          bic: 'you',
          priority: 'medium',
          next_action: 'Initial extraction from Spec Intel'
        }, activeUser)
      }
      
      setStep(4)
    } catch (err) {
      setError(`Import failed: ${err.message}`)
    } finally {
      setImporting(false)
    }
  }

  // Group by division
  const groups = discoveredSections.reduce((acc, s) => {
    if (!acc[s.division]) acc[s.division] = []
    acc[s.division].push(s)
    return acc
  }, {})

  return (
    <div className="spec-hub">
      {/* Top Bar Duplicate for consistency */}
      <div className="top-bar">
        <button className="btn btn-icon" onClick={onBack} title="Back to Workbench">
          <ArrowLeft size={16} />
        </button>
        <div className="breadcrumb">
          <span>{project.name}</span>
          <ChevronRight size={12} className="breadcrumb-sep" />
          <span className="breadcrumb-active">Spec Intel</span>
        </div>
      </div>

      <div className="stage-body" style={{ background: 'var(--bg-base)' }}>
        {step === 1 && (
          <div style={{ textAlign: 'center', marginTop: '10vh' }}>
            <h1 style={{ fontSize: 32, fontWeight: 900, marginBottom: 12, letterSpacing: '-1px' }}>
              Spec <span style={{ color: 'var(--accent)' }}>Intel Hub</span>
            </h1>
            <p style={{ color: 'var(--text-muted)', marginBottom: 40, maxWidth: 480, margin: '0 auto 40px' }}>
              Upload your project specifications PDF. Our AI will automatically map the table of contents 
              and help you import the divisions you're responsible for.
            </p>
            
            <div 
              className="spec-dropzone" 
              onClick={() => fileInputRef.current?.click()}
            >
              <FileSearch className="spec-dropzone-icon" />
              <div style={{ fontWeight: 600 }}>Click to upload Project Specs</div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>PDF up to 100MB supported</div>
              <input 
                ref={fileInputRef} 
                type="file" 
                hidden 
                accept=".pdf" 
                onChange={handleFileChange} 
              />
            </div>

            {error && (
              <div style={{ color: 'var(--s-rejected)', marginTop: 20, fontSize: 13, background: 'rgba(239,68,68,0.1)', padding: '10px 20px', borderRadius: 8, display: 'inline-block' }}>
                <AlertCircle size={14} style={{ marginRight: 8, display: 'inline' }} />
                {error}
              </div>
            )}
          </div>
        )}

        {step === 2 && (
          <div style={{ textAlign: 'center', marginTop: '15vh' }}>
            <div className="skeleton-circle" style={{ width: 80, height: 80, margin: '0 auto 24px', background: 'var(--accent-dim)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Loader2 size={40} className="spin" style={{ color: 'var(--accent)' }} />
            </div>
            <h2 style={{ fontSize: 24, fontWeight: 800 }}>Analyzing Table of Contents</h2>
            <p style={{ color: 'var(--text-muted)', marginTop: 8 }}>Mining PDF data for project structure...</p>
          </div>
        )}

        {step === 3 && (
          <div style={{ maxWidth: 900, margin: '0 auto' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
              <div>
                <h2 style={{ fontSize: 24, fontWeight: 800 }}>Discovery Results</h2>
                <p style={{ color: 'var(--text-muted)' }}>Select the sections you want to track in your workbench.</p>
              </div>
              <button 
                className="btn btn-primary" 
                onClick={handleImport}
                disabled={selectedIds.size === 0 || importing}
              >
                {importing ? <Loader2 size={14} className="spin" /> : <Import size={14} />}
                Import Selected ({selectedIds.size})
              </button>
            </div>

            <div className="spec-discovery-container" style={{ 
              height: 'calc(100vh - 250px)', 
              minHeight: 500,
              display: 'flex',
              flexDirection: 'column'
            }}>
              <div className="spec-discovery-grid" style={{ 
                background: 'var(--bg-surface)', 
                borderRadius: 16, 
                border: '1px solid var(--border)', 
                display: 'grid',
                gridTemplateColumns: 'minmax(0, 1fr) 320px',
                flex: 1,
                overflow: 'hidden' 
              }}>
                <div className="spec-section-list" style={{ padding: '0 20px', overflowY: 'auto' }}>
                {Object.entries(groups).map(([div, sections]) => (
                  <div key={div} className="spec-wizard-step">
                    <div className="div-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      Division {div}
                      <button 
                        className="btn btn-ghost btn-sm" 
                        style={{ fontSize: 9, padding: '2px 6px' }}
                        onClick={() => selectAllDiv(div)}
                      >
                        All
                      </button>
                    </div>
                    {sections.map(s => {
                      const key = `${s.division}-${s.code}`
                      const active = selectedIds.has(key)
                      return (
                        <div 
                          key={key} 
                          className={`checkbox-item ${active ? 'active' : ''}`}
                          onClick={() => toggleSection(key)}
                          style={{ background: active ? 'var(--accent-dim)' : 'transparent' }}
                        >
                          <input type="checkbox" checked={active} readOnly />
                          <div style={{ flex: 1 }}>
                            <div style={{ fontSize: 11, fontWeight: 700, color: active ? 'var(--accent)' : 'var(--text)' }}>
                              {s.code}
                            </div>
                            <div style={{ fontSize: 11, color: active ? 'var(--text)' : 'var(--text-muted)' }}>
                              {s.title}
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                ))}
              </div>
              
              <div style={{ padding: 40, background: 'var(--bg-base)', borderLeft: '1px solid var(--border)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}>
                <Sparkles size={48} style={{ color: 'var(--accent)', opacity: 0.2, marginBottom: 20 }} />
                <h3 style={{ fontSize: 18, fontWeight: 700 }}>AI Auto-Check</h3>
                <p style={{ color: 'var(--text-muted)', maxWidth: 280, marginTop: 10, fontSize: 13 }}>
                  Select your responsible divisions. We'll automatically build the submittal requirements list for each.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

        {step === 4 && (
          <div style={{ textAlign: 'center', marginTop: '15vh' }}>
            <div style={{ width: 80, height: 80, margin: '0 auto 24px', background: 'var(--s-approved-bg)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Check size={40} style={{ color: 'var(--s-approved)' }} />
            </div>
            <h2 style={{ fontSize: 28, fontWeight: 900 }}>Import Complete!</h2>
            <p style={{ color: 'var(--text-muted)', marginTop: 8, fontSize: 16 }}>
              {selectedIds.size} sections have been added to your {project.name} workbench.
            </p>
            <div style={{ marginTop: 32, display: 'flex', gap: 12, justifyContent: 'center' }}>
              <button className="btn btn-primary" onClick={onBack}>
                Go to Workbench
              </button>
              <button className="btn btn-ghost" onClick={() => setStep(1)}>
                Upload Another
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
