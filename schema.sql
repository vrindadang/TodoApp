-- 1. Create the tasks table with strict constraints matching the app's types.ts
CREATE TABLE IF NOT EXISTS tasks (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    description TEXT NOT NULL,
    client TEXT NOT NULL,
    org TEXT NOT NULL CHECK (org IN ('EY', 'SKRM')),
    category TEXT NOT NULL CHECK (category IN ('Deliverables', 'Pursuits', 'Proposals', 'Admin Work', 'General')),
    deadline DATE NOT NULL,
    junior TEXT,
    status TEXT NOT NULL DEFAULT 'Pending' CHECK (status IN ('Pending', 'In Progress', 'Review', 'Completed')),
    priority TEXT NOT NULL DEFAULT 'Medium' CHECK (priority IN ('Low', 'Medium', 'High', 'Urgent')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Enable Row Level Security (RLS)
-- Since the current application does not implement Supabase Auth, 
-- we enable public access. For production, restrict these to 'authenticated' users.
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;

-- Policy: Allow anyone to read tasks
CREATE POLICY "Enable read access for all users" 
ON tasks FOR SELECT 
USING (true);

-- Policy: Allow anyone to insert tasks
CREATE POLICY "Enable insert access for all users" 
ON tasks FOR INSERT 
WITH CHECK (true);

-- Policy: Allow anyone to update tasks
CREATE POLICY "Enable update access for all users" 
ON tasks FOR UPDATE 
USING (true)
WITH CHECK (true);

-- Policy: Allow anyone to delete tasks
CREATE POLICY "Enable delete access for all users" 
ON tasks FOR DELETE 
USING (true);