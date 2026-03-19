const express = require('express')
const path = require('path')
const cors = require('cors')

const app = express()
const PORT = process.env.PORT || 3002

app.use(cors())
app.use(express.json())

// Serve frontend build
app.use(express.static(path.join(__dirname, 'frontend', 'dist')))

// ─── Health check ──────────────────────────────
app.get('/api/status', (req, res) => {
  res.json({ status: 'ok', service: 'Submittal Tracker', version: '1.0.0' })
})

// ─── SPA fallback ──────────────────────────────
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'frontend', 'dist', 'index.html'))
})

app.listen(PORT, () => {
  console.log(`\n  ✦ Submittal Tracker running at http://localhost:${PORT}\n`)
})
