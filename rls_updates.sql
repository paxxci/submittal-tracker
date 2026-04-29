-- RLS UPDATE FOR PROFILES
DROP POLICY IF EXISTS "Profiles Access" ON public.profiles;
DROP POLICY IF EXISTS "Profiles See Own" ON public.profiles;
DROP POLICY IF EXISTS "Profiles See Org" ON public.profiles;

CREATE OR REPLACE FUNCTION public.get_user_org(my_uid UUID) 
RETURNS UUID AS $$
  SELECT organization_id FROM public.profiles WHERE id = my_uid;
$$ LANGUAGE sql SECURITY DEFINER;

CREATE POLICY "Profiles Access" ON public.profiles
FOR ALL USING ( 
  id = auth.uid() OR 
  organization_id = public.get_user_org(auth.uid()) 
);

-- RLS UPDATE FOR PROJECTS
DROP POLICY IF EXISTS "Projects Access" ON public.projects;

CREATE POLICY "Projects Access" ON public.projects
FOR ALL USING ( 
  organization_id = public.get_user_org(auth.uid()) 
  OR 
  id IN (
    SELECT project_id 
    FROM public.project_members 
    WHERE email = (auth.jwt() ->> 'email')
  )
);
