# Educational Image Finder

A small Vercel-ready educational image search app.

This version is deliberately static: there is no Vite build, no React dependency, and no `/src/main.jsx` import. That avoids the deployment error where Vercel cannot resolve `/src/main.jsx`.

## Files

- `index.html` — app shell
- `styles.css` — styling
- `app.js` — browser-side UI logic
- `api/search.js` — Vercel serverless function that searches Openverse, Wikimedia Commons and NASA
- `package.json` — minimal Node/Vercel metadata

## Deploy on Vercel

1. Upload/push the whole folder contents to GitHub.
2. Import the repo into Vercel.
3. Framework preset: **Other**.
4. Build command: leave blank / None.
5. Output directory: leave blank.
6. Deploy.

## Local development

Install the Vercel CLI if needed:

```bash
npm i -g vercel
```

Then run:

```bash
vercel dev
```

Open the local URL Vercel gives you.

## Notes

The app records licence and attribution metadata, but users should still open the source page before publishing or selling resources.
