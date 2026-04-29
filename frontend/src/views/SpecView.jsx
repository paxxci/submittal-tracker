import React, { useState, useRef, useEffect } from 'react'
import { Upload, FileText, ChevronRight, Check, Loader2, Sparkles, AlertCircle, Search, X, Import } from 'lucide-react'
import * as pdfjsLib from 'pdfjs-dist'
import { getSpecSections, createSpecSection, resolveSpecSectionId } from '../services/spec_service'
import { createSubmittal } from '../services/submittal_service'
import { callAI } from '../services/ai'
import * as XLSX from 'xlsx'

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

// Set worker source using the local public path for 100% reliability
pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.mjs'

export default function SpecView({ project, onBack, activeUser }) {
  const [file, setFile] = useState(null)
  const [loading, setLoading] = useState(false)
  const [step, setStep] = useState(1) // 1: Upload, 2: Discovering Sections, 3: Select & Extract, 4: Results
  const [discoveredSections, setDiscoveredSections] = useState([])
  const [selectedIds, setSelectedIds] = useState(new Set())
  const [importing, setImporting] = useState(false)
  const [error, setError] = useState(null)
  
  const fileInputRef = useRef()
  const csvInputRef = useRef()

  const handleFileImport = (e) => {
    const f = e.target.files?.[0]
    if (!f) return
    
    setLoading(true)
    setError(null)

    const isExcel = f.name.endsWith('.xlsx') || f.name.endsWith('.xls')
    const isCSV = f.name.endsWith('.csv')

    if (isExcel || isCSV) {
      const reader = new FileReader()
      reader.onload = async (event) => {
        try {
          setStep(2)
          let rows = []
          
          if (isExcel) {
            const data = new Uint8Array(event.target.result)
            const workbook = XLSX.read(data, { type: 'array' })
            const sheet = workbook.Sheets[workbook.SheetNames[0]]
            rows = XLSX.utils.sheet_to_json(sheet, { header: 1 })
          } else {
            const text = event.target.result
            rows = text.split('\n').filter(r => r.trim()).map(r => r.split(','))
          }
          
          processDiscoveryRows(rows)
        } catch (err) {
          setError(`Failed to parse file: ${err.message}`)
          setStep(1)
        } finally {
          setLoading(false)
        }
      }
      
      if (isExcel) reader.readAsArrayBuffer(f)
      else reader.readAsText(f)
    } else {
      setError('Please upload a .csv, .xlsx, or .xls file.')
      setLoading(false)
    }
  }

  const processDiscoveryRows = (rows) => {
    if (!rows || rows.length === 0) return

    // Advanced Heuristic: Support more keywords (including typos like 'desciption')
    const headers = rows[0].map(h => String(h || '').trim().toLowerCase())
    let codeIndex = headers.findIndex(h => h.includes('code') || h.includes('csi') || h.includes('section') || h.includes('number') || h.includes('no.'))
    let titleIndex = headers.findIndex(h => h.includes('title') || h.includes('item') || h.includes('desc'))

    // If no headers match, assume Column 0 is Code and Column 1 is Title
    const hasHeaders = codeIndex !== -1 || titleIndex !== -1
    if (codeIndex === -1) codeIndex = 0
    if (titleIndex === -1 && rows[0].length > 1) titleIndex = 1
    
    const startRow = hasHeaders ? 1 : 0
    const dataRows = rows.slice(startRow)
    
    // Filter out rows that are entirely empty or just have whitespace
    const validRows = dataRows.filter(row => {
      const code = String(row[codeIndex] || '').trim()
      const title = String(row[titleIndex] || '').trim()
      return code !== '' || title !== ''
    })

    const sections = validRows.map(row => ({
      division: String(row[codeIndex] || '').trim().substring(0, 2) || '00',
      code: String(row[codeIndex] || '').trim() || 'GENERAL',
      title: String(row[titleIndex] || '').trim() || 'Imported Item'
    }))

    setDiscoveredSections(sections)
    setStep(3)
  }

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
      
      let sections = []

      // TIER 1: NATIVE PDF OUTLINE (BOOKMARKS)
      try {
        const outline = await pdf.getOutline()
        if (outline && outline.length > 0) {
          console.log("Found native PDF outline! Extracting bookmarks...")
          
          const flattenOutline = (items) => {
            let result = []
            for (const item of items) {
              result.push(item.title)
              if (item.items && item.items.length > 0) {
                result = result.concat(flattenOutline(item.items))
              }
            }
            return result
          }
          
          const allTitles = flattenOutline(outline)
          
          // Look for CSI codes in the bookmark titles: "26 05 19 - Wire" or "260519 Wire" or "26_05_44" or "27 05 28.29"
          const csiRegex = /^(\d{2})[\s-_]?(\d{2})[\s-_]?(\d{2}(?:\.\d+)?)\s*[-_:]?\s*(.+)$/
          
          for (const title of allTitles) {
            const match = title.trim().match(csiRegex)
            if (match) {
              const div = match[1]
              const code = `${match[1]} ${match[2]} ${match[3]}`
              const name = match[4].trim()
              // Avoid duplicates
              if (!sections.find(s => s.code === code)) {
                sections.push({ division: div, code: code, title: name })
              }
            }
          }
        }
      } catch (e) {
        console.warn("Outline extraction failed, falling back to AI scan...", e)
      }

      // TIER 2: AI DEEP SCAN (FALLBACK)
      if (sections.length === 0) {
        const isLargeFile = file.size > 2 * 1024 * 1024 // 2MB
        const scanLimit = isLargeFile ? 150 : 50 // Increased scan limit
        const maxPages = Math.min(pdf.numPages, scanLimit)
        
        let tocText = ''
        let detectedPages = []

        console.log(`No valid bookmarks found. Starting AI Deep Scan of ${maxPages} pages...`)
        
        for (let i = 1; i <= maxPages; i++) {
          const page = await pdf.getPage(i)
          const textContent = await page.getTextContent()
          const strings = textContent.items.map(item => item.str)
          const pageText = strings.join(' ')
          
          // SMART DETECTION: High density of CSI codes means it IS a TOC page.
          // Looks for 6 digits with optional spaces, dashes, or underscores, and optional decimals
          const csiMatches = pageText.match(/\b\d{2}[\s-_]?\d{2}[\s-_]?\d{2}(?:\.\d+)?\b/g)
          const hasHighCsiDensity = csiMatches && csiMatches.length >= 3
          
          // Also check for explicit TOC headers on the first 15 pages
          const isExplicitTOC = i <= 15 && /table\s+of\s+contents|project\s+manual|section\s+index/i.test(pageText)
          
          if (hasHighCsiDensity || isExplicitTOC) {
            tocText += `--- PAGE ${i} ---\n${pageText}\n`
            detectedPages.push(i)
          }
          
          // Prevent the AI prompt from becoming too large, but collect up to 40 pages of TOC
          if (detectedPages.length >= 40) break 
        }

        console.log(`Extracted text from ${detectedPages.length} actual TOC pages. Sending to AI...`)
        
        const prompt = `
          You are a construction specification expert. I am providing a text dump from a ${file.name} project index or body pages.
          
          GOAL: Extract ALL Divisions and Sections listed in this text.
          Do not filter by trade; extract everything so the user can choose their responsibility.
          
          RULES FOR WEIRD FORMATTING:
          1. Codes might be missing spaces (e.g. "260519") or use underscores ("26_05_19"). YOU MUST format them properly as "26 05 19" in your JSON output.
          2. Codes might have decimals (e.g. "27 05 28.29"). Include the decimal in the formatted code.
          3. The word "Division" or "Section" might be missing entirely. Just look for the 6-digit codes and the title next to them.
          4. If the text appears to be body pages (e.g., "SECTION 26 05 11 - REQUIREMENTS"), extract the section headers anyway.
          5. Ignore page numbers, architectural stamps, and introductory legal jargon.
          
          Return ONLY a JSON array:
          [
            { "division": "01", "code": "01 10 00", "title": "Summary of Work" },
            { "division": "26", "code": "26 05 19", "title": "Low-Voltage Power Conductors" },
            { "division": "27", "code": "27 05 28.29", "title": "Hangers and Supports" }
          ]
          
          Text Data:
          ${tocText.slice(0, 80000)} // Deep scan, increased buffer
        `

        const aiResponse = await callAI(prompt)
        try {
          const cleanJson = aiResponse.replace(/```json|```/g, '').trim()
          const match = cleanJson.match(/\[[\s\S]*\]/)
          sections = JSON.parse(match ? match[0] : cleanJson)
        } catch (err) {
          console.error('AI JSON Parse Error:', err, 'Response was:', aiResponse)
          sections = []
        }
      }

      if (sections.length === 0) {
        throw new Error("Could not auto-detect any spec sections in this document. Please use the Bulk Register Lane (Excel/CSV Import) instead.")
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
        const defaultDuration = parseInt(localStorage.getItem(`sa-project-duration-${project.id}`) || 15, 10)
        await createSubmittal({
          project_id: project.id,
          spec_section_id: sectionId,
          item_name: s.title,
          status: 'not_started',
          bic: 'you',
          priority: 'medium',
          next_action: 'Initial extraction from Spec Intel',
          expected_days: defaultDuration
        }, activeUser?.user_metadata?.full_name || activeUser?.email || 'User')
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
              <div className="spec-tag" style={{ position: 'absolute', top: -12, left: '50%', transform: 'translateX(-50%)', background: 'var(--accent)', color: 'white', fontSize: 10, padding: '4px 12px', borderRadius: 100, fontWeight: 900, textTransform: 'uppercase', letterSpacing: 1 }}>
                PDF AI Parser
              </div>
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

            <div style={{ margin: '40px auto', display: 'flex', alignItems: 'center', gap: 20, maxWidth: 480 }}>
              <div style={{ flex: 1, height: 1, background: 'var(--border)' }}></div>
              <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>OR</div>
              <div style={{ flex: 1, height: 1, background: 'var(--border)' }}></div>
            </div>

            <div 
              className="spec-dropzone" 
              style={{ padding: '32px', borderStyle: 'solid', borderColor: 'var(--border)', background: 'rgba(255,255,255,0.02)' }}
              onClick={() => csvInputRef.current?.click()}
            >
              <div className="spec-tag" style={{ position: 'absolute', top: -12, left: '50%', transform: 'translateX(-50%)', background: 'var(--text-muted)', color: 'white', fontSize: 10, padding: '4px 12px', borderRadius: 100, fontWeight: 900, textTransform: 'uppercase', letterSpacing: 1 }}>
                Bulk Register Lane
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, justifyContent: 'center' }}>
                <div style={{ width: 40, height: 40, background: 'rgba(34, 197, 94, 0.1)', color: '#22c55e', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <FileText size={20} />
                </div>
                <div style={{ textAlign: 'left' }}>
                  <div style={{ fontWeight: 600 }}>Import from Excel / CSV</div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4 }}>Best for large submittal registers</div>
                  <div style={{ 
                    fontSize: 9, 
                    display: 'inline-flex', 
                    alignItems: 'center', 
                    gap: 4, 
                    padding: '2px 8px', 
                    background: 'rgba(255,255,255,0.05)', 
                    borderRadius: 4, 
                    color: 'var(--accent)',
                    border: '1px solid var(--accent-dim)' 
                  }}>
                    <span>💡 Use headers like:</span>
                    <strong style={{ opacity: 0.8 }}>"Number"</strong>
                    <span>&</span>
                    <strong style={{ opacity: 0.8 }}>"Description"</strong>
                  </div>
                </div>
              </div>
              <input 
                ref={csvInputRef} 
                type="file" 
                hidden 
                accept=".csv, .xlsx, .xls" 
                onChange={handleFileImport} 
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
            <h2 style={{ fontSize: 24, fontWeight: 800 }}>
              {file?.type === 'application/pdf' ? 'Analyzing Table of Contents' : 'Processing Data Register'}
            </h2>
            <p style={{ color: 'var(--text-muted)', marginTop: 8 }}>
              {file?.type === 'application/pdf' ? 'Mining PDF data for project structure...' : 'Organizing your submittal list...'}
            </p>
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
