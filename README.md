# TeacherOnCall Image Finder

A Vercel-ready React app for searching educationally appropriate, open-licence images for tests, slides and worksheets.

## What this version fixes

The frontend now calls the simple Vercel API route:

```txt
/api/search
```

A compatibility route is also included at:

```txt
/api/images/search
```

This avoids the common Vercel issue where the frontend receives the text `The page could not be found` instead of JSON.

## Upload to GitHub

After unzipping, upload the **contents of this folder** to your GitHub repository root.

Your repo root should show:

```txt
api/
src/
index.html
package.json
vite.config.js
tailwind.config.js
postcss.config.js
vercel.json
README.md
```

Do not upload the whole folder as a nested folder unless you set that folder as the Vercel project root.

## Vercel settings

Use the defaults after importing the GitHub repo:

```txt
Framework Preset: Vite
Build Command: npm run build
Output Directory: dist
Install Command: npm install
```

## Optional environment variables

Smithsonian Open Access requires an API key for reliable access.

```txt
SMITHSONIAN_API_KEY=your_key_here
RESULT_LIMIT=48
```

If `SMITHSONIAN_API_KEY` is not set, the Smithsonian source is skipped and the app still works.

## API test

After deployment, open:

```txt
https://your-vercel-domain.vercel.app/api/health
```

It should return:

```json
{ "ok": true, "service": "TeacherOnCall Image Finder API" }
```

Then test:

```txt
https://your-vercel-domain.vercel.app/api/search?query=meiosis%20diagram&domain=stem
```

It should return a JSON array.
