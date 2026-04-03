# 🏗️ Submittal Tracker Pro — Master Plan

This document serves as the high-level roadmap for transitioning the Submittal Tracker from a local prototype to a production-grade company tool.

---

## 🛡️ Phase 1: Security & Foundation
- [x] **Auth Layer**: Professional Sign-In/Sign-Up flow.
- [x] **Role-Based Access**: Internal logic to filter projects by membership.
- [ ] **Hard Lockdown (RLS)**: Finalize Row-Level Security in the database.
- [x] **Smart Invitations**: Frictionless team onboarding via links.

---

## 🚀 Phase 2: Deployment & Field Testing
- [ ] **Production Hosting**: Deploy the frontend to Vercel/Netlify.
- [ ] **Custom Domain**: (Optional) Link `submittals.yourcompany.com`.
- [ ] **Mobile Optimization**: Verify UI responsiveness on tablets/phones for field use.
- [ ] **PDF Branded Templates**: Finalize the look and feel of the "Professional Log Report."

---

## 📊 Phase 3: Monitoring & Scale
- [ ] **Activity Audit Trail**: Monitor who made what changes and when.
- [ ] **Storage Quotas**: Monitor PDF upload sizes to stay within Supabase free/pro tiers.
- [ ] **Vendor Portal**: Specialized views for subcontractors to upload submittals directly.

---

## 🗝️ Critical Reminders
- **Data Isolation**: Each company job is its own "Project" entry. RLS ensures PMs from Job A cannot see Job B.
- **Backups**: GitHub is the home for the code; Supabase is the home for the data.
- **Charging Model**: If scaled, we transition to a Supabase "Pro" plan ($25/mo) to handle higher traffic/storage.

---

> [!IMPORTANT]
> **NEXT IMMEDIATE STEP**: Run the SQL Lockdown script in Supabase to enable RLS.
