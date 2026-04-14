# Bookaholic Dimension — Book Sharing & Recommendation Website
---

## Overview

Bookaholic Dimension is a book sharing, recommendation, and review website with a dark, mysterious interface. The entire website sits behind an auth wall — every page requires authentication.

**Key Features:**
- Sign in with Email/Password
- Propose new books, categorized by genre
- 1–5 star rating system (one review per user per book, editable)
- Upload and listen to ambient music shared across the entire community
- Persistent music minibar that stays visible during page navigation
- Parallax scrolling, particle effects, and fade-in animations
- Smooth page transitions powered by Framer Motion
- Real-time updates via Supabase Realtime

---

## System Requirements

| Tool | Minimum Version |
|---|---|
| Node.js | 18.x or higher |
| npm | 9.x or higher |
| Git | Any |

---

## Step 1 — Set Up Supabase

### 1.1 Create a Supabase Project

1. Go to [https://supabase.com](https://supabase.com) and sign up or log in
2. Click **New project**
3. Fill in: project name, database password (save this), and region (choose closest to your users)
4. Wait ~2 minutes for the project to be provisioned

### 1.2 Run the Database Schema

1. In the Supabase dashboard, go to **SQL Editor** (left sidebar)
2. Click **New query**
3. Open the file `supabase-schema.sql` from this project
4. Paste the entire contents into the editor
5. Click **Run** (or press Ctrl+Enter)

This creates all four tables (`users`, `books`, `reviews`, `music`), Row Level Security policies, indexes, and enables Realtime.

### 1.3 Create Storage Buckets

In the Supabase dashboard, go to **Storage** > **New bucket** and create two buckets:

| Bucket name | Public |
|---|---|
| `music` | Yes |
| `covers` | Yes |

Both buckets must be **public** so audio files and cover images load correctly in the browser.

After creating each bucket, go to **Storage** > select the bucket > **Policies** > **New policy** > **For full customization**, then add:

```sql
-- Allow authenticated users to upload
CREATE POLICY "Auth users can upload"
ON storage.objects FOR INSERT
WITH CHECK (auth.role() = 'authenticated');

-- Allow public read
CREATE POLICY "Public read"
ON storage.objects FOR SELECT
USING (true);

-- Allow uploaders to delete their own files
CREATE POLICY "Uploaders can delete"
ON storage.objects FOR DELETE
USING (auth.uid()::text = (storage.foldername(name))[1]);
```

Apply these policies to **both** the `music` and `covers` buckets.

### 1.4 Disable Email Confirmation (Recommended for Development)

By default Supabase requires users to confirm their email before signing in.

To disable this during development:
1. Go to **Authentication** > **Providers** > **Email**
2. Toggle off **Confirm email**
3. Click **Save**

For production, leave email confirmation enabled and the app will show a "Check your email" screen after registration.

### 1.5 Get Your API Keys

1. Go to **Project Settings** > **API**
2. Copy:
   - **Project URL** (looks like `https://xxxxxxxxxxxxxxxxxxxx.supabase.co`)
   - **anon / public** key (long JWT string)

---

## Step 2 — Install and Run Locally

### 2.1 Unzip the Project

```bash
unzip bookaholic-dimension.zip
cd bookaholic-dimension
```

### 2.2 Create the `.env.local` File

Create a `.env.local` file in the project root (same directory as `package.json`):

```
VITE_SUPABASE_URL=https://xxxxxxxxxxxxxxxxxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

Fill in the values from Step 1.5.

### 2.3 Install Dependencies

```bash
npm install
```

### 2.4 Start the Development Server

```bash
npm run dev
```

Open your browser at `http://localhost:5173`

---

## Step 3 — Deploy to Vercel

### 3.1 Create a Vercel Account

Sign up at [https://vercel.com](https://vercel.com) using your GitHub account.

### 3.2 Push the Code to GitHub

```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/<your-username>/<your-repo>.git
git push -u origin main
```

> **Important:** The `.env.local` file is already listed in `.gitignore` — never commit it to Git.

### 3.3 Import the Project on Vercel

1. Go to Vercel Dashboard > **Add New Project**
2. Select the GitHub repository you just pushed
3. Framework preset: **Vite**
4. Build command: `npm run build`
5. Output directory: `dist`

### 3.4 Add Environment Variables on Vercel

Go to **Project Settings** > **Environment Variables** and add both variables:

```
VITE_SUPABASE_URL
VITE_SUPABASE_ANON_KEY
```

Click **Deploy**.

### 3.5 Add Your Vercel Domain to Supabase Allowed URLs

1. Go to **Supabase Dashboard** > **Authentication** > **URL Configuration**
2. Add your Vercel URL to **Redirect URLs**:
   ```
   https://bookaholic-dimension.vercel.app/**
   ```
3. Also update **Site URL** to your production domain if needed

---

## Project Structure

```
bookaholic-dimension/
├── public/
│   └── favicon.svg
├── src/
│   ├── main.jsx                  — Entry point
│   ├── App.jsx                   — Router, providers, AnimatePresence
│   ├── supabase.js               — Supabase client
│   ├── contexts/
│   │   ├── AuthContext.jsx       — Auth state, login, register, logout
│   │   └── MusicContext.jsx      — Global player state
│   ├── pages/
│   │   ├── Login.jsx             — Landing page + auth wall entry
│   │   ├── Register.jsx          — Registration with email confirmation
│   │   ├── Home.jsx              — Hero parallax + book grid + genre filter
│   │   ├── BookDetail.jsx        — Book details + review system
│   │   ├── NewBook.jsx           — Book proposal form
│   │   ├── Profile.jsx           — Personal books & reviews
│   │   └── MusicManager.jsx      — Upload & manage shared music
│   ├── components/
│   │   ├── layout/
│   │   │   ├── AuthGuard.jsx
│   │   │   ├── AppLayout.jsx
│   │   │   ├── Navbar.jsx
│   │   │   ├── MusicPlayer.jsx   — Persistent bottom minibar
│   │   │   └── LoadingScreen.jsx
│   │   ├── books/
│   │   │   ├── BookCard.jsx
│   │   │   ├── BookGrid.jsx
│   │   │   ├── GenreFilter.jsx
│   │   │   └── ReviewForm.jsx
│   │   ├── ui/
│   │   │   ├── StarRating.jsx    — SVG polygon star rating
│   │   │   ├── ParticleBackground.jsx
│   │   │   └── FadeInSection.jsx
│   │   └── music/
│   │       ├── TrackList.jsx
│   │       └── UploadForm.jsx
│   └── styles/
│       ├── variables.css         — CSS custom properties
│       ├── global.css            — Reset & base styles
│       └── animations.css        — Shared @keyframes
├── supabase-schema.sql           — Full database schema (run in SQL Editor)
├── index.html
├── vite.config.js
├── vercel.json                   — SPA rewrite rule
├── .env.example                  — Environment variable template
├── .gitignore
└── package.json
```

---

## Database Schema Summary

| Table | Description |
|---|---|
| `users` | User profiles mirroring `auth.users` |
| `books` | Book proposals with avg_rating and review_count |
| `reviews` | Reviews with unique constraint on `(book_id, user_id)` |
| `music` | Shared music tracks with Storage URLs |

All tables use Row Level Security (RLS). Users can only modify their own content. The `reviews` table prevents users from reviewing their own books via an RLS check.

---

## Available Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start development server at localhost:5173 |
| `npm run build` | Build for production into the `dist/` directory |
| `npm run preview` | Preview the production build locally |

---

## Troubleshooting

### "Invalid login credentials" on sign in

Make sure the user has confirmed their email, or disable email confirmation in Supabase Auth settings during development.

### "new row violates row-level security policy"

Check that your RLS policies were created correctly by running the full `supabase-schema.sql` file. Go to **Authentication** > **Policies** in the dashboard to verify.

### Audio or images not loading

Confirm that both Storage buckets (`music` and `covers`) are set to **Public** in the Supabase dashboard. Also verify the Storage policies allow public reads.

### Realtime updates not working

Ensure the realtime publication lines at the bottom of `supabase-schema.sql` ran successfully. Check **Database** > **Replication** in the dashboard to confirm the tables are listed.

### Blank page after pressing F5 on Vercel

The `vercel.json` file contains the required SPA rewrite rule. Verify it was committed to Git.

---

## Design System

- **Fonts:** Cinzel (headings), EB Garamond (body content), DM Sans (UI elements)
- **Primary colors:** Candlelight gold `#C8A84B`, Mystic purple `#7055A8`, Deep dark `#0C0C10`
- **Effects:** CSS-only particles, 3-layer parallax scrolling, IntersectionObserver fade-in, Framer Motion page transitions
- **No emoji used anywhere in the interface**

---

## License

MIT
