# MAXIMUS

A responsive cinematic website with a sticky, scroll-controlled canvas sequence, three story chapters, a frame importer, and reduced-motion support. Vanilla HTML/CSS/JavaScript; no build or dependencies required. Node is only used for the optional syntax check.

## Run

From `/workspace/maximus`, run `npm run dev` (Python 3 required). The server listens on port 3000. Run `npm run check` to check JavaScript syntax.

## Use the supplied frames

The uploaded `ezgif-606f6de8959e71e3-png-split.zip` exceeded the workspace transfer limit of 32 MiB, so its images are **not bundled**. Until frames are loaded, the hero shows an abstract CSS composition. In the website’s Frame Studio, load the original ZIP or select its extracted images. Files are processed locally in the browser, naturally sorted by filename, and scrubbed with scroll. ZIP import supports standard unencrypted stored/deflated archives in modern browsers; it excludes ZIP64. It keeps decoded image caching bounded. For very large archives, resize frames before importing.

For a published site with frames loaded automatically, place the optimized images in `public/frames/`, then replace `public/frames/manifest.json` with a JSON array of filenames, for example `["frame-001.webp", "frame-002.webp"]`. No source edits are needed. Test the actual supplied sequence after adding it. Browser imports last only for the current page session.

The HTML includes its CSS and JavaScript so previews do not require separate asset requests. Edit `style.css` or `app.js`, then run `npm run build` to refresh the embedded copies. Typography uses system fonts without external requests. Navigation links move to real page sections; there is no form or backend.
