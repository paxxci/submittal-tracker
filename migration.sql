-- 1. CLEANUP PREVIOUS MRE (If any)
DROP POLICY IF EXISTS "Island Project Security" ON public.projects;
DROP POLICY IF EXISTS "Submittal Island Privacy" ON public.submittals;
DROP POLICY IF EXISTS "Members can see same organization profiles" ON public.profiles;

-- 2. PURGE ALL DATA (Fresh Start)
TRUNCATE public.profiles, public.projects, public.submittals, public.project_members, public.activity_logs, public.attachments, public.spec_sections CASCADE;

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
END $$;

-- 5. ENABLE RLS (Island Security)
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.submittals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attachments ENABLE ROW LEVEL SECURITY;

-- 6. DEFINE ISLAND POLICIES
-- Profiles: Members of the same organization can see each other
CREATE POLICY "Members can see same organization profiles" ON public.profiles 
FOR SELECT USING (organization_id = (SELECT organization_id FROM public.profiles WHERE id = auth.uid()));

-- Projects: Only see projects in your organization AND (you are a member OR you are global staff)
CREATE POLICY "Island Project Security" ON public.projects 
FOR SELECT USING (
    organization_id = (SELECT organization_id FROM public.profiles WHERE id = auth.uid()) 
    AND (
        EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_global_staff = true)
        OR EXISTS (SELECT 1 FROM public.project_members WHERE project_id = projects.id AND email = (SELECT email FROM auth.users WHERE id = auth.uid()))
    )
);

-- Submittals: Only if the parent project is visible
CREATE POLICY "Submittal Island Privacy" ON public.submittals 
FOR ALL USING (
    EXISTS (SELECT 1 FROM public.projects WHERE id = submittals.project_id)
);

-- Activities & Attachments follow the Submittal barrier
CREATE POLICY "Activity Island Privacy" ON public.activity_logs 
FOR ALL USING (
    EXISTS (SELECT 1 FROM public.submittals WHERE id = activity_logs.submittal_id)
);

CREATE POLICY "Attachment Island Privacy" ON public.attachments 
FOR ALL USING (
    EXISTS (SELECT 1 FROM public.submittals WHERE id = attachments.submittal_id)
);
