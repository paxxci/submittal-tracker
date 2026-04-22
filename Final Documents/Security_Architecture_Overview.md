# Security Architecture: The Island Model (V2.0)

## 1. Overview
The Submittal Tracker has been transformed into a secure, multi-tenant SaaS platform. Every user belongs to a strictly isolated "Island" (Organization). Data leakage between islands is physically impossible at the database level.

## 2. The Island Boundary (Organization ID)
Every critical table in the database is now stamped with an `organization_id`.
- **`organizations`**: The container for a company.
- **`profiles`**: Linked to an Org ID. Defines which island a user "lives" on.
- **`projects`**: Linked to an Org ID. Defines which island a project belongs to.

## 3. Row Level Security (RLS) Policies
The database now enforces access rules via Postgres RLS. Even if the frontend code makes a mistake, the database will refuse to serve data from another island.

### Project Access Policy:
Users can ONLY see projects if:
1. They are in the same `organization_id` AND have the `is_global_staff` (Portfolio Access) flag.
2. OR, they are explicitly added to that project via the `project_members` table (Guest/External Access).

### Submittal & Activity Access:
These tables inherit security from the Project. If you can't see the Project, you can't see the Submittal or its logs.

## 4. Onboarding & Registration
### New Organization (Founder)
- **Path**: `/?signup=true`
- **Security**: Requires a valid, unredeemed **License Key** from the `onboarding_keys` table.
- **Result**: Creates a brand new `organization_id` and grants the owner `is_global_staff = true`.

### Team Member (Coworker)
- **Path**: Standard Signup.
- **Security**: Must be pre-invited via the **Team Directory (Shield)**.
- **Result**: On signup, the app "absorbs" the user into the existing Organization and deletes the pending invitation.

## 5. Global Admin (The Shield)
The "Shield" icon in the navigation rail is strictly for **Portfolio-wide management**. 
- Only visible to users with `is_global_staff = true`.
- Allows viewing/editing all projects within the SAME island.
- Controls coworker access levels (Member vs. Portfolio Admin).
