-- 1. Create the tasks table with strict constraints matching the app's types.ts
-- This follows the exact structure you provided but ensures the policies are applied.
CREATE TABLE IF NOT EXISTS public.tasks (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    description text NOT NULL,
    client text NOT NULL,
    org text NOT NULL CHECK (org = ANY (ARRAY['EY'::text, 'SKRM'::text])),
    category text NOT NULL CHECK (category = ANY (ARRAY['Deliverables'::text, 'Pursuits'::text, 'Proposals'::text, 'Admin Work'::text, 'General'::text])),
    deadline date NOT NULL,
    junior text,
    status text NOT NULL DEFAULT 'Pending'::text CHECK (status = ANY (ARRAY['Pending'::text, 'In Progress'::text, 'Review'::text, 'Completed'::text])),
    priority text NOT NULL DEFAULT 'Medium'::text CHECK (priority = ANY (ARRAY['Low'::text, 'Medium'::text, 'High'::text, 'Urgent'::text])),
    created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
    CONSTRAINT tasks_pkey PRIMARY KEY (id)
);

-- 2. Enable Row Level Security (RLS)
-- This is critical. Without RLS enabled and policies defined, Supabase blocks all requests.
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;

-- 3. Define Policies
-- Since the app currently does not use Supabase Auth, we enable public access.

-- Policy: Allow anyone to read tasks
CREATE POLICY "Enable read access for all users" 
ON public.tasks FOR SELECT 
USING (true);

-- Policy: Allow anyone to insert tasks
CREATE POLICY "Enable insert access for all users" 
ON public.tasks FOR INSERT 
WITH CHECK (true);

-- Policy: Allow anyone to update tasks
CREATE POLICY "Enable update access for all users" 
ON public.tasks FOR UPDATE 
USING (true)
WITH CHECK (true);

-- Policy: Allow anyone to delete tasks
CREATE POLICY "Enable delete access for all users" 
ON public.tasks FOR DELETE 
USING (true);