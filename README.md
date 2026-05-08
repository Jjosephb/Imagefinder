# TeacherOnCall Image Finder

A Vercel-ready React app for educators to search for educationally appropriate, openly licensed images for tests, slides and worksheets.

## What it searches

Subject domain routing:

- **General / Cross-Domain**: Openverse + Wikimedia Commons
- **Art**: The Metropolitan Museum of Art + Smithsonian Open Access
- **Humanities**: The Metropolitan Museum of Art + Smithsonian Open Access
- **Science / STEM**: NASA Image and Video Library + PubChem

## Licence enforcement

The backend performs a strict final licence gate. Returned images must be one of:

- CC0 / Public Domain
- CC BY
- CC BY-NC

The backend excludes:

- ND / No Derivatives
- SA / ShareAlike
- restrictive copyright
- unknown copyright
- fair-use-only metadata

## Important Smithsonian note

The app works without a Smithsonian key, but Smithsonian results are skipped unless you add:

```bash
SMITHSONIAN_API_KEY=your_key_here
```

Add this in Vercel under **Project Settings → Environment Variables**.

## Local setup

```bash
npm install
cp .env.example .env
npm run dev:vercel
```

Use `npm run dev:vercel` so the frontend and `/api/images/search` route run together. `npm run dev` runs the Vite frontend only.

## Deploy to Vercel

1. Upload this folder to a GitHub repository.
2. Import the repository into Vercel.
3. Use the detected **Vite** framework preset.
4. Build command should be:

```bash
npm run build
```

5. Output directory should be:

```bash
dist
```

## Required root files

These files must be at the top level of your GitHub repo:

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

## API endpoint

```txt
GET /api/images/search?query=meiosis%20diagram&domain=stem
```

Allowed domain values:

```txt
general
art
humanities
stem
```

The API returns a normalised array only:

```json
[
  {
    "imageUrl": "https://example.com/image.jpg",
    "title": "Example title",
    "author": "Example author",
    "source": "Example source",
    "licenseType": "CC BY",
    "originalLink": "https://example.com/source"
  }
]
```
