# Résumé Studio

A résumé **editor and creator** built around the University of Michigan Ross School of
Business résumé format. Import an existing résumé, edit every section in a live editor,
and export a clean copy to PDF, HTML, Markdown, plain text, or a re-importable JSON
backup. Everything runs in the browser — no accounts, no server, no upload.

## Why I built this

> I was comfortable using University of Michigan's Ross Resume format, its clean and easy.
> However as an alumni I don't think I get access to it. Now while there's a bunch of
> resume builders online, I do know from ross recruiters they do like the simplicty of
> this one and I don't have to be locked into a certain ecosystem or get hit with a
> random fee and I get add my own features like font selection etc

## Features

- **Live two-pane editor** — forms on the left, a black-on-white letter-size sheet on the
  right that updates as you type.
- **Import**
  - *Paste text* — paste any résumé; it extracts your name, contact details, education,
    and experience into editable sections.
  - *Upload PDF* — text is read in the browser with [pdf.js](https://mozilla.github.io/pdf.js/),
    including a pass at reconstructing the Ross template's two-column layout. Scanned /
    image-only PDFs won't have selectable text — paste instead.
- **Build from scratch** — start from a blank Education / Experience / Skills outline.
- **Sections as separators** — each section is a titled, ruled heading with its entries
  nested beneath; year markers sit in a bold left rail, matching the Ross template.
- **Add / reorder / delete** entries and bullet points; add custom sections and skills lists.
- **Personal website toggle** — off by default; flip it on to show a portfolio link on
  its own line (kept even when hidden).
- **Export** — `.pdf` (generated with [jsPDF](https://github.com/parallax/jsPDF), ready to
  send), `.html` (self-contained, print-ready), `.txt`, `.md`, `.json`. Or use **Print →
  Save as PDF** for the browser's own renderer.
- **Autosave** to `localStorage`; light / dark app theme (the résumé sheet is always
  black on white).
- Preloaded with a sample résumé so the first screen shows what the tool does.

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
app.js        state model, editor + preview rendering, résumé parser, exporters
```

No framework. The only dependencies are pdf.js and jsPDF, loaded from a CDN and used only
when you import a PDF or export one.

## Ideas / roadmap

- Font selection for the résumé sheet
- Multiple saved résumés / versions
- One-page fit warnings
- More import formats (DOCX)

## License

MIT — see [LICENSE](LICENSE).
