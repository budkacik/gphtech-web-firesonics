# FireSonics — landing page

A static, dependency-free (aside from GSAP via CDN) landing page. Pure
HTML/CSS/JS — no build step, no npm install. Works by opening
`index.html` directly, and deploys as-is to GitHub Pages.

## File structure

```
/
├── index.html
├── style.css
├── script.js
└── assets/
    ├── logo.svg
    ├── images/          → about section + team portrait placeholders
    └── frames/           → transparent WebP sequence for the scroll animation
        ├── 0001.webp
        ├── 0002.webp
        └── ...
```

## Running locally

Just open `index.html` in a browser — everything is relative paths and
CDN scripts, no server required. (If your browser blocks local file
fetches for the WebP sequence, run any static server from the project
root, e.g. `python3 -m http.server`, then visit `http://localhost:8000`.)

## Deploying to GitHub Pages

1. Push this folder to a GitHub repo.
2. In the repo settings → Pages, set the source to the branch/root
   containing `index.html`.
3. Done — no build step needed.

## Replacing the frame sequence (the pinned scroll animation)

The section right after the hero (`#reel` in `index.html`) plays a
transparent WebP image sequence and scrubs it based on scroll position.

1. Render your Blender animation with a **transparent background**,
   export as a WebP (or PNG, then convert) sequence.
2. Name frames sequentially with 4-digit padding: `0001.webp`,
   `0002.webp`, `0003.webp`, … and drop them into `assets/frames/`.
3. Open `script.js` and update this line near the top of the
   `DOMContentLoaded` handler:

   ```js
   const FRAME_COUNT = 90; // ← set this to your total number of frames
   ```

4. The section's scroll length is controlled in `style.css`:

   ```css
   .reel { height: 3200px; } /* increase for a slower scrub, decrease for faster */
   ```

The demo frames currently in `assets/frames/` are placeholder art
(generated procedurally, not from Blender) purely so the scroll effect
works out of the box — swap them out with your real render.

## Replacing text and branding

All editable copy is in `index.html`, marked with
`<!-- PLACEHOLDER -->` comments. Key spots:

- **Hero**: title, subtitle, and the primary button's link/label.
- **Features**: 3 cards (`#features`) — title + description each.
- **About**: heading, paragraph, and button link (`#about`).
- **Technology grid**: 4 items (`#technology`).
- **Team**: name + role per card (`#team`), plus `assets/images/team-*.svg`.
- **Contact**: email address and social links (`#contact`).
- Page `<title>`, meta description, and `og:*` tags at the top of
  `index.html`.

## Replacing images and logo

- `assets/logo.svg` — swap with your real mark. Used in the nav and
  hero; keep it roughly square.
- `assets/images/about-placeholder.svg` — swap for a real photo/render
  in the About section (any image format works, just update the `src`).
- `assets/images/team-1.svg`, `team-2.svg`, `team-3.svg` — swap for
  real portraits (any image format works).
- `assets/images/og-image.svg` — used for social share previews;
  replace with a real 1200×630 image (referenced in the `og:image`
  meta tag in `index.html`).

## Design tokens

Colors, fonts, radii, and spacing are defined once as CSS custom
properties at the top of `style.css` (the `:root` block) — change a
value there and it updates across the whole page.

## Customizing motion

- GSAP + ScrollTrigger are loaded from `cdnjs.cloudflare.com` in
  `index.html`. To pin the version, edit the two `<script src>` tags.
- All scroll-reveal / pin logic lives in `script.js`, split into
  clearly commented sections (nav, hero, ambient canvas, frame reel,
  generic reveals).
- `prefers-reduced-motion` is respected: the ambient ember canvas and
  most CSS animations are disabled automatically for users who request
  reduced motion at the OS level.
