# Submittal Tracker — architecture.md
*To be filled in after Discovery Questions are answered.*

---

## Component Tree
```
App
├── NavRail
├── Dashboard (view)
│   ├── ProjectCard
│   └── NewProjectModal
├── ProjectView (view)
│   ├── SpecSectionSidebar
│   ├── SubmittalTable
│   │   └── SubmittalRow (inline editing)
│   ├── AddSubmittalModal
│   └── PdfParsePreview (optional)
└── Settings (view)
    └── ContactsManager
```

## State Map
- Global state: `currentProject`, `currentView` — managed in App.jsx
- Data fetching: Supabase calls in isolated `services/api.js`
- Local state: modal open/close, form inputs — in individual components

## Data Flow
```
Supabase DB → api.js (services) → App state → Components → UI
User action → Component → api.js → Supabase DB → re-fetch → UI update
```
