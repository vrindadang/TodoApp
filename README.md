# Executive Legal & Tax Operations Assistant

A professional task management system designed for EY and SKRM workspaces, featuring AI-powered task extraction and follow-up drafting.

## 🚀 Setup Instructions

### 1. Set Environment Variables
In your deployment environment (e.g., Vercel, Netlify), add the following variables:

- `API_KEY`: Your Google Gemini API Key.
- `SUPABASE_URL`: `https://zjtocbovaghvgtxoflje.supabase.co`
- `SUPABASE_KEY`: `sb_publishable_k_wHUTOJdgT3hRjmcaIQyQ_1cHkM1i9`

### 2. Database Setup (Supabase)
Go to your Supabase Dashboard -> SQL Editor and run the following query (also found in `schema.sql`):

```sql
-- Create the tasks table
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

-- Enable Public Access (RLS)
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public Read" ON tasks FOR SELECT USING (true);
CREATE POLICY "Public Insert" ON tasks FOR INSERT WITH CHECK (true);
CREATE POLICY "Public Update" ON tasks FOR UPDATE USING (true);
CREATE POLICY "Public Delete" ON tasks FOR DELETE USING (true);
```

## ✨ Features
- **Multi-Workspace**: Switch between EY (Corporate) and SKRM (Service) modes.
- **AI Nudge Agent**: Automatically drafts professional follow-up messages for overdue tasks.
- **Smart Extraction**: Upload images of handwritten notes to automatically create digital tasks.
- **Master Lists**: Manage client and associate names for quick entry.