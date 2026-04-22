-- 1. TEAM INVITATIONS TABLE
CREATE TABLE IF NOT EXISTS public.organization_invites (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    is_portfolio_access BOOLEAN DEFAULT false,
    role TEXT DEFAULT 'editor',
    created_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(organization_id, email)
);

-- 2. ENABLE SECURITY
ALTER TABLE public.organization_invites ENABLE ROW LEVEL SECURITY;

-- 3. POLICIES
-- Only Org Admins can see/manage invites
CREATE POLICY "Org Admins can manage invites" ON public.organization_invites 
FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_global_staff = true AND organization_id = organization_invites.organization_id)
);

-- Invitees can see their own invite (to accept it)
CREATE POLICY "Invitees can see own invite" ON public.organization_invites 
FOR SELECT USING (email = (SELECT email FROM auth.users WHERE id = auth.uid()));
