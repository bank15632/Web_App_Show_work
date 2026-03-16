# Studio Client Rooms

Private-by-link client portal for interior design work.

This project is built with Next.js App Router, Tailwind CSS v4, and shadcn/ui. It is designed for:

- an owner-only dashboard at `/studio`
- client-facing project rooms at `/p/[slug]`
- grouped documents for `Mood & Tone`, `Design`, `Revision`, `Construction Drawing`, and `Timeline`
- viewing files inside the web page first, then downloading PDF when needed
- deployment behind Cloudflare Pages + Cloudflare Access

## Current Routes

- `/` overview page for the system
- `/studio` owner dashboard
- `/p/riverside-residence-b7x2` sample client room
- `/p/nordic-home-office-l2k7` sample client room
- `/p/atelier-cafe-renovation-m4p1` sample client room

## Local Development

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Validation

```bash
npm run lint
npm run build
```

## Where To Edit Data

Project data lives in:

- [src/lib/portal-data.ts](./src/lib/portal-data.ts)

Replace the sample project entries with your real projects.

For each document, you can later add:

- `viewerUrl` for Canva embed URLs or PDF viewer URLs
- `downloadUrl` for downloadable PDF links

If those fields are still missing, the app uses a built-in preview fallback page.

## Key Files

- [src/app/page.tsx](./src/app/page.tsx) overview / landing
- [src/app/studio/page.tsx](./src/app/studio/page.tsx) owner dashboard
- [src/app/p/[slug]/page.tsx](./src/app/p/[slug]/page.tsx) client room template
- [src/app/preview/[projectSlug]/[documentId]/page.tsx](./src/app/preview/[projectSlug]/[documentId]/page.tsx) preview fallback
- [src/lib/portal-styles.ts](./src/lib/portal-styles.ts) shared link/button styles

## Recommended Deployment

- Source code on a private GitHub repository
- Deploy on Cloudflare Pages
- Protect `/studio/*` and `/p/*` with Cloudflare Access
- Use R2 later only if PDF files become too large for your preferred Pages workflow

## GitHub Push Checklist

1. Create a new private repository on GitHub.
2. Add the remote:

```bash
git remote add origin <your-repo-url>
```

3. Push the `main` branch:

```bash
git push -u origin main
```

## Notes

- The site is already configured with `noindex` metadata.
- This repo currently does not include auth in application code. Access control should be enforced at Cloudflare Access.
