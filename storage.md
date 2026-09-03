I can't write files (no tools in this mode), but here's the full content — save it as `STORAGE.md` in the repo root:

```markdown
# Where your data lives

**All résumé data is stored in your browser's `localStorage`.** Nothing is
uploaded, synced, or sent to any server. There is no backend.

## What this means

- Data is tied to **one browser on one device**. Open the app in a different
  browser, on your phone, or in a private window → it starts empty there.
- Clearing browser data / site data for the app's origin **erases your résumés**.
- The GitHub repo only hosts the *app code*. It never sees your content.
- Sending someone the hosted link shares the empty tool, not your résumé.

## Moving or backing up a résumé

Use **Export → `.json`** to save a full backup file, then **Import** (paste the
JSON) on the other device or browser. That's the only time data leaves the page,
and only because you chose to save a file.

## "Consistent" / cloud storage

Just hosting the static files on your own domain **does not** give you cloud
storage — it's the same `localStorage` model, only the URL changes.

Real cross-device / persistent storage needs a backend. Options if you ever want it:

- **A storage service** (Supabase, Firebase, Cloudflare KV/D1, etc.) — add a
  small sync layer that reads/writes the résumé JSON to a per-user record.
- **Your own tiny API + database** on a host (Vercel, Fly, a VPS) with auth.
- **A synced file** — e.g. write the `.json` export to a Dropbox/Drive folder
  yourself, or wire the app to a personal cloud-drive API.

Until one of those exists, treat the `.json` export as your source of truth and
back it up somewhere you trust.
```