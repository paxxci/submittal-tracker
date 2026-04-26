-- 1. CLEANUP PREVIOUS MRE (If any)
DROP FUNCTION IF EXISTS public.get_my_org_id(UUID) CASCADE;
DROP FUNCTION IF EXISTS public.get_my_org_id() CASCADE;
DROP FUNCTION IF EXISTS public.is_island_admin(UUID) CASCADE;
DROP FUNCTION IF EXISTS public.is_island_admin() CASCADE;

DROP POLICY IF EXISTS "Organizations Access" ON public.organizations;
DROP POLICY IF EXISTS "Profiles Access" ON public.profiles;
DROP POLICY IF EXISTS "Profiles See Own" ON public.profiles;
DROP POLICY IF EXISTS "Profiles See Org" ON public.profiles;
DROP POLICY IF EXISTS "Projects Access" ON public.projects;
DROP POLICY IF EXISTS "Memberships See Own" ON public.project_members;
DROP POLICY IF EXISTS "Memberships Admin" ON public.project_members;
DROP POLICY IF EXISTS "Submittals Access" ON public.submittals;
DROP POLICY IF EXISTS "Attachments Access" ON public.attachments;
DROP POLICY IF EXISTS "Invites Access" ON public.organization_invites;
DROP POLICY IF EXISTS "Activity Access" ON public.activity_log;

-- 2. PURGE ALL DATA (Fresh Start) - ONLY UNCOMMENT IF NEEDED
-- TRUNCATE public.profiles, public.projects, public.submittals, public.project_members, public.activity_log, public.attachments, public.spec_sections CASCADE;

-- 3. ORGANIZATIONS LAYER
CREATE TABLE IF NOT EXISTS public.organizations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    owner_id UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 4. LINK TABLES TO ORGANIZATIONS
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME='profiles' AND COLUMN_NAME='organization_id') THEN
        ALTER TABLE public.profiles ADD COLUMN organization_id UUID REFERENCES public.organizations(id);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME='projects' AND COLUMN_NAME='organization_id') THEN
        ALTER TABLE public.projects ADD COLUMN organization_id UUID REFERENCES public.organizations(id);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME='project_members' AND COLUMN_NAME='organization_id') THEN
        ALTER TABLE public.project_members ADD COLUMN organization_id UUID REFERENCES public.organizations(id);
    END IF;
END $$;

-- 5. ENABLE RLS (Island Security)
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.submittals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organization_invites ENABLE ROW LEVEL SECURITY;

-- 6. DEFINE THE SILVER BULLET HELPER FUNCTIONS
-- Notice we pass 'my_uid' as an argument so Supabase never loses track of the user
CREATE OR REPLACE FUNCTION public.get_user_org(my_uid UUID) 
RETURNS UUID AS $$
  SELECT organization_id FROM public.profiles WHERE id = my_uid;
$$ LANGUAGE sql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.is_user_admin(my_uid UUID) 
RETURNS BOOLEAN AS $$
  SELECT is_global_staff FROM public.profiles WHERE id = my_uid;
$$ LANGUAGE sql SECURITY DEFINER;

-- 7. THE BULLETPROOF POLICIES

-- ORGANIZATIONS
CREATE POLICY "Organizations Access" ON public.organizations
FOR ALL USING ( id = public.get_user_org(auth.uid()) );

-- PROFILES
CREATE POLICY "Profiles Access" ON public.profiles
FOR ALL USING ( 
  id = auth.uid() OR 
  organization_id = public.get_user_org(auth.uid()) 
);

-- PROJECTS
CREATE POLICY "Projects Access" ON public.projects
FOR ALL USING ( organization_id = public.get_user_org(auth.uid()) );

-- MEMBERSHIPS
-- Notice we use token (auth.jwt) to get email, avoiding auth.users system table crash!
CREATE POLICY "Memberships See Own" ON public.project_members
FOR SELECT USING ( email = (auth.jwt() ->> 'email') );

CREATE POLICY "Memberships Admin" ON public.project_members
FOR ALL USING (
  public.is_user_admin(auth.uid()) = true AND 
  organization_id = public.get_user_org(auth.uid())
);

-- SUBMITTALS (If you can see the project, you can see these)
CREATE POLICY "Submittals Access" ON public.submittals
FOR ALL USING ( project_id IN (SELECT id FROM public.projects) );

-- ATTACHMENTS (If you can see the submittal, you can see these)
CREATE POLICY "Attachments Access" ON public.attachments
FOR ALL USING ( submittal_id IN (SELECT id FROM public.submittals) );

-- ACTIVITIES (If you can see the submittal, you can see these)
CREATE POLICY "Activity Access" ON public.activity_log
FOR ALL USING ( submittal_id IN (SELECT id FROM public.submittals) );

-- INVITES
CREATE POLICY "Invites Access" ON public.organization_invites
FOR ALL USING ( organization_id = public.get_user_org(auth.uid()) );
