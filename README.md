# QR Studio

A browser-only QR generator and designer built with React, Vite, and qr-code-styling. No API, backend, analytics, or remote font service is used. QR content and uploaded logos are processed locally.

## Run

Requires Node.js 20.19+ or 22.12+.

```sh
npm ci
npm run dev
```

## Build and deploy to Vercel

```sh
npm run build
npx vercel --prod
```

Alternatively import this directory as a Vercel project. The included `vercel.json` selects Vite, `npm run build`, and `dist`. QR generation works on any static host.

## Features

- Website URL, Unicode text, email with subject/message, telephone, and Wi-Fi (WPA, WEP, open, hidden).
- Live SVG preview, four editable presets, solid/gradient colors, four module patterns.
- 256–2048 px exports, quiet zone in modules, L/M/Q/H error correction.
- Local logo upload, resized to 256 px, embedded in SVG, and automatic H error correction.
- Matching PNG and SVG exports; PNG clipboard copy on supported secure browsers.
- Eight recent codes, saved on download, copy, or explicit Save to recents; restoration and clear-all.
- Persistent light/dark theme, responsive layout, validation, contrast/density/margin/style warnings.

Recent codes use localStorage and contain their original content, including Wi-Fi passwords. Clear recents on shared devices. Browser storage can be cleared by the browser or user. Clipboard image support and permissions vary by browser; PNG download remains available.

## Tests

```sh
npx playwright install chromium
npm test
```

Playwright exercises all payload types, invalid input, presets, patterns, sizes, correction levels, logos, SVG embedding, clipboard behavior, local persistence, and mobile widths. PNG exports are independently decoded by jsQR at original or camera-like reduced resolution. SVG rasterization is compared pixel-for-pixel with PNG. Actual device/printed scanning remains recommended, especially for decorative styles and logos.

## Implementation

`src/qr.js` validates and serializes payloads, explicitly encodes UTF-8 bytes, calculates module-based quiet zones, and checks readability. `src/main.jsx` owns editor state and uses the same QR instance for preview and downloads. Asynchronous generation discards outdated renders. `src/style.css` defines both themes and responsive layouts. Fonts are bundled locally through Fontsource.

The QR code does not expire, but linked websites can change or become unavailable. This app creates static codes; it does not provide redirects or scan tracking.
