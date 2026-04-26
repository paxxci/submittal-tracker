-- Fix RLS Policy for spec_sections table
ALTER TABLE public.spec_sections ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Spec Sections Access" ON public.spec_sections;

CREATE POLICY "Spec Sections Access" ON public.spec_sections
FOR ALL 
USING ( project_id IN (SELECT id FROM public.projects) )
WITH CHECK ( project_id IN (SELECT id FROM public.projects) );
