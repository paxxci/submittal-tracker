# 🏗️ Submittal Tracker Pro — Master Plan

This document serves as the high-level roadmap for transitioning the Submittal Tracker from a local prototype to a production-grade company tool.

---

## 🛡️ The Sunday "Go-Live" Sprint
- [ ] **Hard Lockdown (RLS)**: Execute Row-Level Security in Supabase so no users or vendors can cross-pollinate project data.
- [ ] **Production Hosting**: Deploy the frontend repository immediately to Vercel so the application gets a live public URL.
- [ ] **Vendor Sandbox Test**: Create a mock project, invite a real vendor to the live URL, and walk through their restricted upload/chat flows.
- [ ] **Mobile Optimization**: Run a final audit of the CSS on mobile resolutions to ensure PMs can view details seamlessly on iPads or phones in the field.

---

## 📊 Phase 3: Post-Launch & Scale
- [ ] **Custom Domain**: Link a formal company URL to the Vercel deployment.
- [ ] **Storage Quotas**: Monitor PDF upload sizes to stay within Supabase free/pro tiers.

---

## 🗝️ Critical Reminders
- **Data Isolation**: Each company job is its own "Project" entry. RLS ensures PMs from Job A cannot see Job B.
- **Backups**: GitHub is the home for the code; Supabase is the home for the data.
- **Charging Model**: If scaled, we transition to a Supabase "Pro" plan ($25/mo) to handle higher traffic/storage.
