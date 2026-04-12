# 🛡️ Submittal Tracker Pro: Data Privacy & Security Primer

**An Executive Summary for Stakeholders, Architects, and Project Owners.**

At Submittal Tracker Pro, we understand that construction project data—especially for government, financial, and institutional facilities—requires the highest level of confidentiality. Our platform is engineered with a **"Security-First"** architecture to ensure your proprietary information remains your own.

---

## 1. 🧬 AI Privacy & The "No-Train" Guarantee
We utilize **Enterprise-Grade AI APIs** (via OpenRouter connecting to Claude and GPT models). Unlike "Public" AI interfaces:
*   **Zero Training:** Your data is **never** used to train the base AI models. Once a specification section is processed, the data is instantly flushed from the AI's ephemeral memory.
*   **Stateless Processing:** We do not send full project plans or sensitive blueprints to the AI. Only text-based specification requirements are analyzed for the purpose of building your submittal register.

## 2. 🔐 Data Isolation & Encryption
Your documents are housed in a **Private Cloud Vault** powered by Supabase (PostgreSQL).
*   **Encryption at Rest:** All PDF files and database entries are encrypted using industry-standard AES-256 encryption.
*   **Row-Level Security (RLS):** Our database utilizes "Zero-Trust" logic. Only authorized members specifically invited to a project can view its contents. Even the platform owner cannot view project files without an explicit invitation.

## 3. 🚧 Infrastructure Integrity
*   **Hosting:** Our application is hosted on **Vercel**, providing global-standard DDoS protection and a secure SSL/TLS encrypted connection for every user session.
*   **Storage:** All attachments are stored in private buckets. Public access is disabled, meaning a direct link to a document will not work without a valid, timed security token issued by the app.

## 4. 🔏 Compliance & Control
*   **Ownership:** You maintain 100% ownership of your data. We do not sell, share, or analyze your data for third-party marketing or commercial purposes.
*   **Audit Trail:** Every interaction with a document is logged with a timestamp and user ID, providing a legal-grade record of who accessed what and when.

---

### Conclusion
Submittal Tracker Pro combines the speed of modern AI with the security of a private bank vault. You can manage your most sensitive projects with confidence, knowing that your data is isolated, protected, and private.

> [!NOTE]
> *For further technical questions regarding our infrastructure, please contact our support team.*

---

© 2026 Submittal Tracker Pro | Built for the Field. Secured for the Owner.
