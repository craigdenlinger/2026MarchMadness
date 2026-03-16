# NCAA Tournament Pool App

This is a Next.js + Supabase web app for your March Madness pool.

## What it does
- Public entry form for participants
- Exactly 4 picks per region + 1 bonus pick = 17 total picks
- Bonus pick must be a different team from the other 16 picks
- Entries are final once submitted
- Live leaderboard with click-through participant cards
- Team popularity page with bar chart
- Admin entry manager so you can delete test entries
- Payment method field (Venmo / Paypal) on submissions
- Live leaderboard with points, live teams, and max remaining points
- Manual result entry for safety / backup
- Optional automatic sync using ESPN's public scoreboard endpoint

## Scoring built into the app
- Each tournament win is worth the team's seed
- First Four / play-in wins do **not** count
- Play-in winners **can** still be picked and score from the Round of 64 onward
- Championship game is worth **seed × 5** for that game only
- No tiebreaker; tied entries stay tied

---

## Before you start
You will need:
1. A free or paid **Supabase** account
2. A **Vercel** account for hosting
3. Node.js installed on your computer
4. The included official 2026 team list already in this project

---

## Step 1: Create the Supabase project
1. Go to Supabase and create a new project.
2. Wait for the database to finish provisioning.
3. In Supabase, open **Project Settings** → **Data API**.
4. Copy these values:
   - Project URL
   - service_role key

Keep those handy.

---

## Step 2: Create the database tables
1. In Supabase, open the **SQL Editor**.
2. Open the file `supabase/schema.sql` from this project.
3. Copy the whole file and run it in the SQL Editor.
4. Confirm that these tables exist afterward:
   - tournaments
   - teams
   - participants
   - entries
   - entry_picks
   - games

---

## Step 3: Put the project on your computer
Open Terminal (Mac) or Command Prompt / PowerShell (Windows).

### Option A: if you already have this folder
Just unzip it somewhere easy, like your Desktop.

### Option B: if you want to move it later
Put it in a folder like:
- `Desktop/ncaa-pool-app`

Then in the terminal, go into the folder:

```bash
cd /path/to/ncaa-pool-app
```

---

## Step 4: Create your environment file
1. In the project folder, copy `.env.example` to a new file named `.env.local`
2. Fill in the real values.

Example:

```bash
NEXT_PUBLIC_APP_NAME=Craig's March Madness Pool
NEXT_PUBLIC_APP_URL=http://localhost:3000
TOURNAMENT_YEAR=2026
SUPABASE_URL=https://YOUR_PROJECT.supabase.co
SUPABASE_SERVICE_ROLE_KEY=YOUR_REAL_SERVICE_ROLE_KEY
ADMIN_SECRET=make-this-a-long-random-password
SYNC_SECRET=make-this-another-long-random-password
CRON_SECRET=make-this-a-third-random-password
ESPN_SYNC_ENABLED=false
```

Tips:
- `ADMIN_SECRET` is the password you will type into the admin pages
- `SYNC_SECRET` is what the automatic sync route uses
- Start with `ESPN_SYNC_ENABLED=false` until everything else is working

---

## Step 5: Install the app dependencies
In the project folder, run:

```bash
npm install
```

---

## Step 6: Start the app locally
Run:

```bash
npm run dev
```

Then open:

```text
http://localhost:3000
```

You should see the pool home page.

---

## Step 7: Import the official 2026 bracket teams
You do **not** need to build the team list yourself. This project already includes the official 2026 men's bracket field from NCAA.com.

### How to import them
1. Open the app in your browser:
   - `http://localhost:3000/admin/import-teams`
2. Enter your `ADMIN_SECRET`
3. Leave the preloaded JSON exactly as-is
4. Click **Import official 2026 bracket teams**

That imports all 64 Round of 64 teams plus the 4 play-in winner slots for a total of 68 selectable tournament slots.

### Important note about the 4 play-in slots
The imported list includes these pickable placeholders:
- `Texas / NC State winner`
- `Prairie View A&M / Lehigh winner`
- `UMBC / Howard winner`
- `Miami (Ohio) / SMU winner`

That matches your scoring rules:
- First Four wins do **not** count
- but the eventual winners of those games **are** valid picks from the Round of 64 onward

The sync route is set up to automatically promote those placeholder slots to the actual winning team after the First Four game is final, without awarding points for the play-in win itself.

### Included files
If you want to inspect the team list directly, it is already included here:
- `data/teams-2026-men.json`
- `lib/officialTeams2026.ts`

### Optional ESPN team IDs
The app can run without ESPN team IDs. It uses built-in name normalization and special handling for the play-in slots. If you ever want to harden it further, you can still add `espn_team_id` values later.

---

## Step 8: Set the lock time
The SQL file creates a default tournament row. You should update the lock time before collecting entries.

In Supabase SQL Editor, run something like:

```sql
update tournaments
set lock_at = '2026-03-19T10:15:00-06:00'
where year = 2026;
```

Use your real deadline.

---

## Step 9: Test entry submission
1. Go to `http://localhost:3000/enter`
2. Enter a test name
3. Pick 4 teams in each region
4. Pick 1 bonus team
5. Submit the form

Then go back to the leaderboard home page and confirm the entry appears.

---

## Step 10: Manual game updates
This is the backup method and the safest method if the automatic feed ever breaks.

1. Go to `/admin/manual-results`
2. Enter your `ADMIN_SECRET`
3. Pick the winner and loser
4. Enter the round number
5. Check the championship box only for the title game
6. Submit

The leaderboard should update on refresh.

---

## Step 11: Optional automatic score syncing
This project includes an automatic sync route that uses ESPN's public scoreboard endpoint as a practical source. It also contains special handling for the four 2026 First Four winner slots so those picks become the real team automatically once the play-in games finish.

### Important note
This is convenient, but it is **not** an officially documented developer API. If ESPN changes its response format, that route may need a small code update.

### To enable it
In `.env.local`, change:

```bash
ESPN_SYNC_ENABLED=true
```

Then restart the dev server.

### Test it manually
Go to:
- `/admin/sync`

Enter your `SYNC_SECRET` or `ADMIN_SECRET`, then run the sync.

---

## Step 12: Deploy to Vercel
1. Create a GitHub account if you do not already have one.
2. Create a new GitHub repository.
3. Upload this project to that repo.
4. In Vercel, choose **Add New Project**.
5. Import the GitHub repo.
6. In the Vercel project settings, add the same environment variables from `.env.local`.
7. Deploy.

When deployment finishes, Vercel will give you a live URL like:

```text
https://your-pool-app.vercel.app
```

That is the site you can share with your players.

---

## Step 13: Optional Vercel cron job
If you want automatic score checks, create a file named `vercel.json` in the project root with something like:

```json
{
  "crons": [
    {
      "path": "/api/admin/sync-scores",
      "schedule": "*/15 * * * *"
    }
  ]
}
```

Then update the route so it authorizes Vercel cron requests the way you prefer, or keep it protected and manually trigger syncs from the admin page.

Because Vercel's cron capabilities and plan rules can change, double-check the current cron docs in your Vercel dashboard before relying on a specific frequency.

---

## Recommended easiest setup for you
If you want the least stressful version:
1. Use the app exactly as-is
2. Load the teams
3. Let players submit entries
4. Use **manual result entry** during the tournament

That will be more than enough for a 20-player pool and avoids any API surprises.

---

## File overview
- `app/` = the website pages and API routes
- `components/` = reusable UI parts
- `lib/` = data helpers and scoring logic
- `supabase/schema.sql` = database setup
- `.env.example` = environment variable template

---

## One thing you may want me to do next
A very good next step would be for me to make a second version that includes:
- a prettier sports-dashboard UI
- participant detail pages
- CSV import for teams and player picks
- a safer cron auth pattern for Vercel deployment



## Official 2026 bracket source used in this project
The included 2026 men's bracket field matches NCAA.com's official bracket that was announced on Selection Sunday, March 15, 2026.


## Step 12: New payment field
The entry form now requires each participant to choose **Venmo** or **Paypal**.

If your database was already created before this update, run this in Supabase SQL Editor:

```sql
alter table entries add column if not exists payment_method text null;
alter table entries drop constraint if exists entries_payment_method_check;
alter table entries add constraint entries_payment_method_check check (payment_method in ('Venmo', 'Paypal'));
```

## Step 13: Remove test entries
Visit `/admin/entries`, type your admin secret, and use the **Delete** button next to any test entry.

## Step 14: Automatic live sync in production
This project now includes a real `vercel.json` with a cron job pointing to `/api/admin/sync-scores`.

To enable it on Vercel:
1. Add `CRON_SECRET` to Vercel environment variables
2. Add `ESPN_SYNC_ENABLED=true` to Vercel environment variables
3. Redeploy the project
4. In Vercel, confirm a cron job appears under **Settings → Cron Jobs**

The sync route accepts:
- `x-admin-secret: ADMIN_SECRET` for manual admin use
- `x-admin-secret: SYNC_SECRET` for manual sync use
- `Authorization: Bearer CRON_SECRET` for Vercel cron

If you stay on a Vercel Hobby plan, scheduled sync is limited by Vercel plan rules, so manual admin sync may still be the better option during game windows.
