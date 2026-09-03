# Résumé Studio

A résumé **editor and creator** built around the University of Michigan Ross School of
Business résumé format. Keep one living master document with every experience, then
toggle sections and bullet points on or off to produce a tailored résumé for each role.
Export to PDF, HTML, Markdown, plain text, or a re-importable JSON backup.

**Everything runs in your browser.** No account, no server, no upload, no analytics — your
résumé data is written only to this browser's `localStorage` and never leaves the page.
Run it locally or host the static files anywhere; either way the privacy model is the same.

## Why I built this

> I was comfortable using University of Michigan's Ross Resume format, its clean and easy.
> However as an alumni I don't think I get access to it. Now while there's a bunch of
> resume builders online, I do know from ross recruiters they do like the simplicty of
> this one and I don't have to be locked into a certain ecosystem or get hit with a
> random fee and I get add my own features like font selection etc

## Features

- **Live two-pane editor** — forms on the left, a black-on-white letter-size sheet on the
  right that updates as you type.
- **Include / exclude anything** — a checkbox on every section, every entry, and every
  bullet point controls whether it appears on the résumé. Uncheck what a given role
  doesn't need; the item stays in your document, just hidden from the output. This is the
  core workflow: one master résumé, many tailored views.
- **My résumés** — keep multiple named versions (Base, VC Analyst, Consulting, …).
  Duplicate one, retitle it, then toggle items for that role. Switch between them from the
  chip in the toolbar. All stored locally.
- **Import**
  - *Paste text* — paste any résumé; it extracts your name, contact details, education,
    and experience into editable sections. Paste a `.json` backup to restore a résumé exactly.
  - *Upload PDF* — text is read in the browser with [pdf.js](https://mozilla.github.io/pdf.js/),
    including a pass at reconstructing the Ross template's two-column layout. Scanned /
    image-only PDFs won't have selectable text — paste instead.
- **Build from scratch** — start from a blank Education / Experience / Skills outline.
- **Sections as separators** — each section is a titled, ruled heading with its entries
  nested beneath; year markers sit in a bold left rail, matching the Ross template.
- **Add / reorder / delete** entries and bullet points; collapse an entry's bullets while
  editing; add custom sections and skills lists.
- **Personal website toggle** — off by default; flip it on to show a portfolio link on
  its own bold line (kept even when hidden).
- **Preview PDF** — renders the actual generated PDF (via pdf.js) so you can see exactly
  where lines wrap and pages break before downloading; warns if it runs past one page.
- **Export** — `.pdf` (generated with [jsPDF](https://github.com/parallax/jsPDF), ready to
  send), `.html` (self-contained, print-ready), `.txt`, `.md`, `.json`. Every export
  reflects the current show/hide state. Or use **Print → Save as PDF** for the browser's
  own renderer.
- **Autosave** to `localStorage`; light / dark app theme (the résumé sheet is always
  black on white).
- Preloaded with a sample résumé so the first screen shows what the tool does.

## Privacy

The app is a set of static files with no backend. It makes no network requests except to
load fonts (Google Fonts) and, only when you import or export a PDF, the pdf.js / jsPDF
libraries from a CDN. Your résumé content is saved to `localStorage` in the browser you're
using and is never transmitted anywhere. Sharing a recruiter a link to a hosted copy shares
the *app*, not your data. To move a résumé between devices, export a `.json` and import it
on the other side.

## Run it

It's a static site — no build step.

```sh
# any static file server works
python3 -m http.server 8000
# then open http://localhost:8000
```

or just open `index.html` in a browser (PDF/HTML export still work; some browsers restrict
`file://` for the CDN scripts, so a local server is recommended).

## Deploy

**GitHub Pages:** push to `main`, then Settings → Pages → Source: *Deploy from a branch* →
`main` / `/ (root)`. The site publishes at `https://<user>.github.io/Resume-Editor/`.

Any static host (Netlify, Vercel, Cloudflare Pages, S3) works the same way — point it at
the repo root.

## Project structure

```
index.html    markup + <head> (fonts, CDN scripts)
styles.css    app UI + résumé sheet styling, light/dark tokens, print rules
app.js        résumé store (named versions), state model + normalizer,
              editor + preview rendering, résumé/PDF/JSON parser, exporters
```

`index.html`, `styles.css` and `app.js` are generated from a single working file; edit
them directly — there's no build step.

No framework. The only dependencies are pdf.js and jsPDF, loaded from a CDN and used only
when you import a PDF or export one.

## Ideas / roadmap

- Font selection for the résumé sheet
- One-page fit warnings
- Reorder résumés in the "My résumés" list
- More import formats (DOCX)

## License

MIT — see [LICENSE](LICENSE).
