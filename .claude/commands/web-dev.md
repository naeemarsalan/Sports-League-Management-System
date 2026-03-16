---
description: Start Next.js dev server and work on the marketing website
---

Work on the Next.js marketing website at `web-template/project/`.

Setup:
```bash
cd web-template/project && npm run dev
```

Key pages:
- `/` - Landing page with animated snooker theme
- `/knowledge-base` - Help articles
- `/privacy` - Privacy policy (required for App Store)
- `/terms` - Terms of service
- `/support` - Support/contact page

Tech stack: Next.js 15 (App Router), Tailwind CSS 3.4, Framer Motion 12
Domain: snookerpoolleague.co.uk

SEO files: `robots.ts`, `sitemap.ts` in src/app/

When making changes:
- Use Next.js App Router conventions (layout.tsx, page.tsx)
- Use Tailwind for styling
- Add Framer Motion animations where appropriate
- Ensure pages are SEO-friendly with proper metadata
- Docker build: `docker compose up --build` in web-template/project/
