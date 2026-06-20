# 🏠 House Points

A shared family chore + points tracker with real-time sync across all phones.

---

## Setup (takes ~15 minutes, no coding required)

### Step 1 — Create your Supabase database (free)

1. Go to **supabase.com** and click **Start your project**
2. Sign up with Google or email
3. Click **New Project** → name it `house-points` → pick any region → create a password → click **Create new project** (takes ~2 min to spin up)
4. Once ready, go to the **SQL Editor** (left sidebar, looks like `</>`)
5. Click **New query** and paste this exactly:

```sql
create table app_state (
  id integer primary key,
  state jsonb not null,
  updated_at timestamptz default now()
);

alter table app_state enable row level security;

create policy "Allow all" on app_state for all using (true) with check (true);
```

6. Click **Run** — you should see "Success. No rows returned"
7. Now go to **Settings → API** (gear icon in left sidebar)
8. Copy two things and save them somewhere:
   - **Project URL** (looks like `https://xxxxxxxxxxxx.supabase.co`)
   - **anon public** key (long string under "Project API keys")

---

### Step 2 — Deploy to Vercel (free)

1. Go to **github.com** and create a free account if you don't have one
2. Create a **new repository** called `house-points` (click the + in top right → New repository → name it → Public → Create)
3. Upload all the files from this folder to that repo (drag and drop them into the GitHub file browser)
4. Go to **vercel.com** → sign up with your GitHub account → click **Add New Project**
5. Import your `house-points` repo → click **Deploy**
6. Before it finishes deploying, go to **Settings → Environment Variables** in your Vercel project and add:
   - `NEXT_PUBLIC_SUPABASE_URL` = your Project URL from Step 1
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` = your anon key from Step 1
7. Go to **Deployments** → click the three dots on your latest deployment → **Redeploy**

That's it! You'll get a URL like `house-points.vercel.app` — share it with Joe and Jet.

---

## Adding to your phone home screen

**iPhone:** Open the URL in Safari → tap the Share button → "Add to Home Screen"  
**Android:** Open in Chrome → tap the three dots → "Add to Home Screen"

It will look and feel like a real app.

---

## How it works

- **Board** — everyone's points, family pot progress, pending approvals
- **Log Task** — pick who did it, pick the task, send for approval
- **Approve** — approve someone else's completed task (can't approve your own)
- **Rewards** — see what everyone's working toward

Everyone picks who they are when they open the app. Points sync in real time across all phones.
