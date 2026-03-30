# Submittal Tracker — schema.md
*F.O.R.G.E. Phase 2: Data-First Rule — Approved ✅*

---

## Core Data Shapes

### Project
```json
{
  "id": "uuid",
  "name": "GPWTP Electrical",
  "number": "PEC-2024-001",
  "client": "General Contractor Name",
  "address": "123 Project Site Ave",
  "created_at": "2024-01-15T00:00:00Z"
}
```

### Spec Section
Groups submittals by CSI division code.
```json
{
  "id": "uuid",
  "project_id": "uuid",
  "csi_code": "26 05 19",
  "title": "Low Voltage Electrical Power Conductors",
  "division": "Division 26 - Electrical"
}
```

### Submittal
The core tracked item.
```json
{
  "id": "uuid",
  "project_id": "uuid",
  "spec_section_id": "uuid",
  "item_name": "12 AWG THHN Copper Wire",
  "status": "submitted",
  "bic": "engineer",
  "priority": "high",
  "next_action": "Follow up with EOR if no response by 4/5",
  "round": 1,
  "due_date": "2024-04-01",
  "submitted_date": "2024-03-15",
  "created_at": "2024-03-01T00:00:00Z",
  "updated_at": "2024-03-15T00:00:00Z"
}
```

**Status:** `pending | submitted | in_review | approved | revise_resubmit | rejected`
**BIC:** `you | pm | gc | engineer | architect | vendor`
**Priority:** `high | medium | low`
**Round:** Integer — 1 = first submission, 2 = resubmittal, etc.

### Activity Log
Timestamped feed per submittal — like a chat thread.
```json
{
  "id": "uuid",
  "submittal_id": "uuid",
  "author": "Michael",
  "message": "Submitted to EOR via email. Awaiting stamp.",
  "created_at": "2024-03-15T14:32:00Z"
}
```

### Attachment
PDF files stored in Supabase Storage.
```json
{
  "id": "uuid",
  "submittal_id": "uuid",
  "file_name": "26-05-19_THHN_Wire_Cutsheet_R1.pdf",
  "file_url": "https://supabase.storage.../...",
  "uploaded_at": "2024-03-15T00:00:00Z"
}
```

### Contact
People associated with a project.
```json
{
  "id": "uuid",
  "project_id": "uuid",
  "name": "John Smith",
  "company": "Smith Engineering",
  "role": "engineer",
  "email": "j.smith@smitheng.com"
}
```

---

## Supabase Table Map

| Table | Key Relationships |
|---|---|
| `projects` | Root entity |
| `spec_sections` | belongs to `projects` |
| `submittals` | belongs to `spec_sections` + `projects` |
| `activity_log` | belongs to `submittals` |
| `attachments` | belongs to `submittals` |
| `contacts` | belongs to `projects` |

---

## State Map (Frontend)

| State | Where it lives |
|---|---|
| `currentProject` | App.jsx (global) |
| `currentView` | App.jsx (global) |
| `selectedSubmittal` | ProjectView.jsx (local) |
| Modal open/close | Individual component (local) |
| All DB reads/writes | `services/api.js` (isolated) |

---

## V2 — AI Chat Layer
After core tracker is complete, add a Gemini-powered chat interface that reads live Supabase data and answers questions like:
- "What's overdue this week?"
- "Who has the lighting fixtures for GPWTP?"
- "What does the engineer still need to return?"
Schema is designed to support this from day one.
