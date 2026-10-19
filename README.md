# MAXIMUS — Next.js

A cinematic, responsive website built with the Next.js App Router and React. The homepage is server-rendered; a client component initializes the scroll-controlled canvas and local frame importer with effect cleanup. Global CSS is imported through the root layout and bundled by Next.js.

## Development

Requires Node.js 20.9 or newer and npm.

```sh
npm ci
npm run dev
```

The development server binds to all interfaces on port 3000. Set a different port with `npm run dev -- --port 3001`.

## Production and checks

```sh
npm run check
npm run build
npm start
```

`check` generates Next.js route types and runs TypeScript validation. Application files use JavaScript/JSX; production compilation validates JSX. `build` creates the production app; `start` serves it on port 3000. Deploy directly to a Next.js-compatible Node host such as Vercel with the standard build command `npm run build`.

## Structure

- `app/layout.jsx`: root document, metadata, global stylesheet import.
- `app/page.jsx`: homepage and story sections.
- `app/frame-controller.jsx`: browser-only canvas playback, ZIP import, bounded decoded-image cache, and event/object-URL cleanup.
- `app/globals.css`: responsive styling, animation, reduced-motion rules.
- `public/frames/manifest.json`: optional bundled frame list.

## Frames

The supplied `ezgif-606f6de8959e71e3-png-split.zip` exceeded the environment's 32 MiB transfer limit. Its frames are **not bundled**. The hero displays an abstract CSS composition until images are loaded.

Use **Load Your Frames** to select the ZIP or multiple extracted images. Files stay in the browser and are naturally sorted by filename. Modern browsers support standard unencrypted stored/deflated ZIP archives; ZIP64 is not supported. Browser imports last for the current page session. Reduced-motion users see a still frame.

For automatic playback on a deployed site, put optimized images in `public/frames/` and list filenames in `public/frames/manifest.json`, for example `["frame-001.webp", "frame-002.webp"]`. Next.js serves these at `/frames/`; do not prefix URLs with `/public/`. Test the actual supplied sequence once it is available.

No API keys, external fonts, or backend are required. Navigation links move to page sections. The former standalone HTML and Python server have been replaced by Next.js.
