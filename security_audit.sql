-- 1. Enable RLS on child tables
ALTER TABLE public.submittals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contacts ENABLE ROW LEVEL SECURITY;

-- 2. Drop existing policies to prevent conflicts
DROP POLICY IF EXISTS "Submittals Access" ON public.submittals;
DROP POLICY IF EXISTS "Activity Log Access" ON public.activity_log;
DROP POLICY IF EXISTS "Attachments Access" ON public.attachments;
DROP POLICY IF EXISTS "Contacts Access" ON public.contacts;

-- 3. Create Cascading Policies
CREATE POLICY "Submittals Access" ON public.submittals
FOR ALL 
USING ( spec_section_id IN (SELECT id FROM public.spec_sections) )
WITH CHECK ( spec_section_id IN (SELECT id FROM public.spec_sections) );

CREATE POLICY "Activity Log Access" ON public.activity_log
FOR ALL 
USING ( submittal_id IN (SELECT id FROM public.submittals) )
WITH CHECK ( submittal_id IN (SELECT id FROM public.submittals) );

CREATE POLICY "Attachments Access" ON public.attachments
FOR ALL 
USING ( submittal_id IN (SELECT id FROM public.submittals) )
WITH CHECK ( submittal_id IN (SELECT id FROM public.submittals) );

CREATE POLICY "Contacts Access" ON public.contacts
FOR ALL 
USING ( project_id IN (SELECT id FROM public.projects) )
WITH CHECK ( project_id IN (SELECT id FROM public.projects) );
