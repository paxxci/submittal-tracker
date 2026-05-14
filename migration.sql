ALTER TABLE public.submittals DROP CONSTRAINT IF EXISTS submittals_status_check;
ALTER TABLE public.submittals ADD CONSTRAINT submittals_status_check CHECK (status IN ('not_started', 'working', 'ready', 'submitted', 'in_review', 'approved', 'approved_as_noted', 'revise_resubmit', 'rejected'));
