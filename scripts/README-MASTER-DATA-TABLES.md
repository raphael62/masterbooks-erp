# Create Master Data Tables (Location Types, Customer Groups, Customer Types)

If you see **"Could not find the table 'public.customer_groups' in the schema cache"** (or similar for `location_types`, `customer_types`), run one of the options below.

---

## Option A: Run the SQL script (recommended)

### 1. Get your Database URL
- Go to **[Supabase Dashboard](https://supabase.com/dashboard)**
- Select your project
- Click **Project Settings** (gear icon in the sidebar)
- Click **Database** in the left menu
- Scroll to **Connection string**
- Select **URI**
- Copy the full connection string (it looks like: `postgresql://postgres.xxxxx:[YOUR-PASSWORD]@aws-0-xx.pooler.supabase.com:6543/postgres`)

### 2. Add to .env
Open the `.env` file in the project root and add a new line:

```
DATABASE_URL=paste-your-connection-string-here
```

Replace `paste-your-connection-string-here` with the string you copied. Make sure to replace `[YOUR-PASSWORD]` with your actual database password if it’s shown as a placeholder.

### 3. Run the script
In the project folder, run:

```
npm run create-master-data-tables
```

You should see: `Created location_types, customer_groups, customer_types tables with seed data.`

---

## Option B: Run SQL manually in Supabase (most reliable)

1. Go to **[Supabase Dashboard](https://supabase.com/dashboard)** → select your project
2. Click **SQL Editor** in the left sidebar
3. Click **+ New query**
4. Open `scripts/create-master-data-tables.sql` in your editor
5. Select all (Ctrl+A) and copy
6. Paste into the Supabase SQL Editor
7. Click **Run** (or Ctrl+Enter)
8. You should see "Success. No rows returned" – that's correct

**Verify:** Go to **Table Editor** – you should see `location_types`, `customer_groups`, `customer_types`.

---

After either option, **hard refresh your browser** (Ctrl+F5) so the app picks up the schema.
