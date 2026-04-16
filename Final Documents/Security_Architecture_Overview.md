# Submittal Tracker Pro — Security Overview
*Platform Intelligence & Data Integrity*

## 🏛️ Industrial-Grade Infrastructure
The application is built on the world's most resilient cloud backbone, leveraging the same infrastructure patterns used by industry leaders such as Autodesk Construction Cloud and Procore.

- **Hosting:** Data resides in dedicated AWS (Amazon Web Services) clusters.
- **Encryption:** AES-256 encryption at rest and TLS 1.2+ for all data in transit.
- **Compliance:** SOC2 Type II, HIPAA, and ISO 27001 certified underlying platform architecture.

## 🔐 Row-Level Security (RLS) Vault
Unlike traditional databases, our architecture implements security at the *data layer*. Every individual row in our database is guarded by specific logic that verifies user identity before permission is granted.

- **Strict Isolation:** Multi-tenant isolation ensures project data is never shared or "leaked" between organizations.
- **Zero Trust:** No request is trusted by default; authentication is required for every single operation.

## 🧠 Submittal Architect — AI Data Privacy
Our AI-driven processing ensures information is extracted without compromising proprietary project data.

- **Zero Retention:** Data processed by our AI models is never used for training or stored by the model providers.
- **Private Tunnel:** Information is transmitted via encrypted enterprise channels (OpenRouter/Supabase) and discarded immediately after processing.

---

> "We haven't just put your data in the cloud; we've built a private, hardened environment designed specifically for the high-stakes requirements of modern electrical contracting."

*© 2026 Submittal Tracker Pro | Confidential Project Memo | April 15, 2026*
