# Educational Image Finder

A small React + Vercel app for finding open/licensed educational diagrams and images for tests, slides and worksheets.

## What it does

- Searches Openverse, Wikimedia Commons and NASA Image and Video Library.
- Normalises image results into one consistent format.
- Shows licence/source/creator information beside each image.
- Saves selected images into an image tray.
- Copies attribution text for an attribution page.
- Copies HTML `<figure>` blocks for inserting into tests or worksheets.
- Copies JSON blobs that can be imported into a separate testmaker app later.
- Creates teacher-made placeholders when no suitable image is found.

## Current sources

- Openverse: openly licensed / public domain media search.
- Wikimedia Commons: public domain and freely licensed educational media.
- NASA Image and Video Library: space, Earth science and astronomy media.

## Important licence note

This app helps record attribution information, but it does not guarantee copyright clearance. Open the original source page before publishing or selling a resource. NASA media should be used factually and must not imply NASA endorsement.

## Local development

Install dependencies:

```bash
npm install
```

For the full app including the Vercel API route, run:

```bash
npx vercel dev
```

Then open the local URL shown by Vercel.

`npm run dev` will run the Vite frontend only. The image search endpoint lives in `/api/search.js`, so Vercel dev is recommended.

## Deploy to Vercel

1. Push this folder to GitHub.
2. Import the repository into Vercel.
3. Framework preset: Vite.
4. Build command: `npm run build`.
5. Output directory: `dist`.
6. Deploy.

No API keys are required for the v1 sources.

## How to use with a testmaker app

Use one of these workflows:

### Simple copy/paste

Click **Use image**, then **Copy HTML**. Paste the HTML figure block into the relevant question block.

### Importer-friendly JSON

Click **Use image**, then **Copy JSON for importer** from the image tray. Your testmaker can parse the JSON and insert the image, source page and attribution.

### Future direct integration

Embed the app inside your testmaker as an iframe or move the `/api/search.js` logic into your testmaker backend. The selected image object already contains the fields you need:

```json
{
  "type": "educational-image",
  "title": "...",
  "imageUrl": "...",
  "source": "...",
  "sourceUrl": "...",
  "creator": "...",
  "licence": "...",
  "licenceUrl": "...",
  "attribution": "..."
}
```

## Future improvements

- Add optional Pixabay/Pexels/Unsplash API keys for slide-background photos.
- Add AI query rewriting using your own OpenAI API key.
- Add subject-specific presets for biology, chemistry, physics and astronomy.
- Add a direct image insertion bridge for your existing testmaker.
- Add export to DOCX attribution appendix.
