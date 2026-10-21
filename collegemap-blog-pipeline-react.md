# CollegeMap — Blog Publishing Pipeline (React version)

Adapted from the original Next.js brief for our React (Vite/CRA + React Router) stack.
Same workflow for Anuj, different implementation on the frontend since we don't have
Next's `getStaticProps`/ISR — we'll do client-side fetching with a short cache instead.

---

## 1. Supabase — SQL to run

Run this in the Supabase SQL Editor.

```sql
-- 1. Table
create table public.blogs (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  title text not null,
  content text not null,          -- markdown
  image_url text,
  meta_description text,
  published boolean not null default false,
  created_at timestamptz not null default now()
);

-- 2. Index for fast slug lookups
create index blogs_slug_idx on public.blogs (slug);

-- 3. Enable RLS
alter table public.blogs enable row level security;

-- 4. Public (anon) can only READ published posts
create policy "Public can read published blogs"
on public.blogs
for select
using (published = true);

-- No insert/update/delete policy for anon/authenticated —
-- writes only happen via the service_role key in Apps Script,
-- which bypasses RLS entirely. This is the key safety boundary:
-- service_role key never goes near the React app.
```

### Storage bucket

```sql
-- Create bucket (or do this in Dashboard → Storage → New bucket)
insert into storage.buckets (id, name, public)
values ('blog-images', 'blog-images', true);

-- Allow public read of images
create policy "Public read blog-images"
on storage.objects
for select
using (bucket_id = 'blog-images');
```

Anuj still uploads images manually via the Supabase dashboard and pastes the public URL into the sheet — no change there.

---

## 2. Google Sheet + Apps Script — unchanged

This part stays exactly as in the original brief. The service_role key lives **only** in Apps Script (server-side, never shipped to a browser), so it's safe there. Same columns, same `syncToSupabase()` script, same "Sync" button.

One addition — validate slugs before syncing so bad rows don't silently fail:

```javascript
function syncToSupabase() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  const rows = sheet.getDataRange().getValues();
  const headers = rows[0];
  const SUPABASE_URL = "https://YOUR_PROJECT.supabase.co";
  const SUPABASE_KEY = "YOUR_SERVICE_ROLE_KEY"; // store in Script Properties, not hardcoded — see note below

  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    const data = {};
    headers.forEach((h, j) => data[h] = row[j]);

    if (data.published !== true) continue;
    if (!data.slug || !/^[a-z0-9-]+$/.test(data.slug)) {
      Logger.log(`Skipping row ${i + 1}: invalid slug "${data.slug}"`);
      continue;
    }

    const res = UrlFetchApp.fetch(`${SUPABASE_URL}/rest/v1/blogs`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "apikey": SUPABASE_KEY,
        "Authorization": `Bearer ${SUPABASE_KEY}`,
        "Prefer": "resolution=merge-duplicates"
      },
      payload: JSON.stringify(data),
      muteHttpExceptions: true
    });

    if (res.getResponseCode() >= 300) {
      Logger.log(`Row ${i + 1} failed: ${res.getContentText()}`);
    }
  }
}
```

**Better practice for the key:** store it in `Project Settings → Script Properties` instead of hardcoding, and read it with `PropertiesService.getScriptProperties().getProperty("SUPABASE_SERVICE_KEY")`. Same effect, but it's not sitting in plaintext in the script body if anyone ever shares/copies the sheet.

---

## 3. React app

### Supabase client (`src/lib/supabaseClient.js`)

```javascript
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY; // anon key ONLY — never service_role

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
```

Env vars in `.env`:
```
VITE_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
VITE_SUPABASE_ANON_KEY=YOUR_ANON_PUBLIC_KEY
```

(If you're on CRA instead of Vite, use `REACT_APP_SUPABASE_URL` / `REACT_APP_SUPABASE_ANON_KEY` and `process.env.REACT_APP_...`.)

### Routes (React Router)

```jsx
// App.jsx
import { Routes, Route } from "react-router-dom";
import BlogList from "./pages/BlogList";
import BlogPost from "./pages/BlogPost";

<Routes>
  {/* ...existing routes... */}
  <Route path="/blog" element={<BlogList />} />
  <Route path="/blog/:slug" element={<BlogPost />} />
</Routes>
```

### `src/pages/BlogList.jsx`

```jsx
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "../lib/supabaseClient";

export default function BlogList() {
  const [blogs, setBlogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchBlogs() {
      const { data, error } = await supabase
        .from("blogs")
        .select("slug, title, meta_description, image_url, created_at")
        .eq("published", true)
        .order("created_at", { ascending: false });

      if (!error) setBlogs(data);
      setLoading(false);
    }
    fetchBlogs();
  }, []);

  if (loading) return <p>Loading posts...</p>;

  return (
    <div className="blog-list">
      {blogs.map((b) => (
        <Link key={b.slug} to={`/blog/${b.slug}`} className="blog-card">
          {b.image_url && <img src={b.image_url} alt={b.title} />}
          <h2>{b.title}</h2>
          <p>{b.meta_description}</p>
        </Link>
      ))}
    </div>
  );
}
```

### `src/pages/BlogPost.jsx`

```jsx
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import ReactMarkdown from "react-markdown";
import { supabase } from "../lib/supabaseClient";

export default function BlogPost() {
  const { slug } = useParams();
  const [blog, setBlog] = useState(null);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    async function fetchBlog() {
      const { data, error } = await supabase
        .from("blogs")
        .select("*")
        .eq("slug", slug)
        .eq("published", true)
        .single();

      if (error || !data) setNotFound(true);
      else setBlog(data);
    }
    fetchBlog();
  }, [slug]);

  if (notFound) return <p>Post not found.</p>;
  if (!blog) return <p>Loading...</p>;

  return (
    <article className="blog-post">
      <h1>{blog.title}</h1>
      {blog.image_url && <img src={blog.image_url} alt={blog.title} />}
      <ReactMarkdown>{blog.content}</ReactMarkdown>
    </article>
  );
}
```

Install what's needed:

```bash
npm install @supabase/supabase-js react-markdown
```

### On the "new posts appear without a redeploy" point

Next's ISR (`revalidate: 60`) doesn't have a direct React SPA equivalent — but you don't need one. Since `BlogList` and `BlogPost` fetch straight from Supabase on every page load (not at build time), a new row synced from the sheet is live the moment someone loads `/blog` or `/blog/:slug` — no redeploy, no 60-second wait even. If you later want SEO-friendly pre-rendering per post, that's when you'd reach for something like Vite's SSG plugin or a prerendering service — worth flagging separately if collegemap.in needs blog posts indexable by Google, since a pure CSR SPA can be slower to get crawled.

---

## 4. Anuj's workflow — unchanged

1. Write article (Markdown)
2. Upload image to Supabase Storage → copy public URL
3. Fill one row in the Google Sheet
4. Set `published` = TRUE
5. Click "Sync" button in sheet
6. Post is live on next page load (effectively immediate)

---

## 5. One-time setup checklist

- [x] Run the SQL above to create `blogs` table + RLS policy
- [x] Create `blog-images` bucket (public) + storage policy
- [x] Add `/blog` and `/blog/:slug` routes in React Router
- [x] Build `BlogList.jsx` and `BlogPost.jsx`
- [x] Add Supabase client using **anon key only** (`.env`, not committed to git)
- [x] Create Google Sheet with the columns above
- [x] Add Apps Script with service_role key (ideally via Script Properties, not hardcoded)
- [x] Add "Sync" button wired to `syncToSupabase()`
- [x] `npm install @supabase/supabase-js react-markdown`
- [x] Confirm `.env` is in `.gitignore`
