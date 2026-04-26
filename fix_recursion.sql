-- 1. Add the missing Island Tag
ALTER TABLE public.project_members ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES public.organizations(id);

-- 2. Backfill: Link every member to the Organization of the project they belong to
UPDATE public.project_members
SET organization_id = p.organization_id
FROM public.projects p
WHERE project_members.project_id = p.id
AND project_members.organization_id IS NULL;

-- 3. Enable Security
ALTER TABLE public.project_members ENABLE ROW LEVEL SECURITY;

-- 4. Install Clean, Non-Recursive Policies
DROP POLICY IF EXISTS "Members can see their project memberships" ON public.project_members;
DROP POLICY IF EXISTS "Admins can manage island memberships" ON public.project_members;

-- Rule A: Anyone can see their own memberships
CREATE POLICY "Members can see their project memberships" ON public.project_members
FOR SELECT USING (
    email = (SELECT email FROM auth.users WHERE id = auth.uid())
);

-- Rule B: Island Admins (Global Staff) have full control over memberships on their island
CREATE POLICY "Admins can manage island memberships" ON public.project_members
FOR ALL USING (
    EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE id = auth.uid() 
        AND is_global_staff = true 
        AND organization_id = project_members.organization_id
    )
);
