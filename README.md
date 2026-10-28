# NewsForge AI

NewsForge AI is an early-stage, template-first news website generator. It is designed to grow into a SaaS product that creates branded news websites and connects them to real WordPress installations.

## Current MVP

- Responsive dashboard with nine reusable news layout presets for broadcast, newspaper, magazine, regional-language, business and lightweight publishing.
- Branding controls for news brand name, language, and primary color.
- Feature toggles for breaking ticker, live TV section, ad slots, and social links.
- Live design preview that updates as settings change.
- Template inspiration notes for Indian news-publishing patterns; these presets are original UI layouts, not bundled third-party WordPress themes.
- Server-side, validated website configuration generation at POST /api/generate.
- Export of generated configuration as a JSON file. Export re-generates the configuration from the current form values, so changing the brand, language, color, template or feature toggles before export does not silently download an older configuration.
- WordPress authentication test at POST /api/wordpress using HTTPS and a revocable WordPress Application Password.
- Explicit WordPress starter publishing action that creates missing standard news categories and publishes About, Contact, and Privacy Policy starter pages; existing items with matching slugs are left unchanged. Partial failures are reported per item.
- Clear UI messaging: generating a configuration is not the same as publishing a website.

## Recent UI/UX improvements

- Search and filter the nine layout presets by template name, category, or tags; the library shows the matching count and a helpful empty state.
- Keep the live site preview visible while scrolling the builder on desktop, while letting it return to normal document flow on smaller screens.
- Improve keyboard focus visibility, checkbox interaction feedback, button hover states, and reduced-motion support.
- Make template search and selection controls more comfortable to use on mobile.

These changes improve discovery and navigation in the existing builder; they do not imply that a WordPress site is automatically published or that preview placeholder copy is live news content.

## Template strategy

The presets are original layouts informed by common WordPress publishing patterns. For a real WordPress installation, evaluate and license themes directly from their official publishers before using them:

- **ColorMag** / **Newsup** — news-magazine and regional portal patterns.
- **Newspaper** / **JNews** — feature-rich editorial and multi-section news patterns (check commercial licensing).
- **Astra** / **GeneratePress** — lightweight foundations that can be customized for local-language publishers.

NewsForge currently previews its own layouts and exports configuration; it does **not** download, bundle, or install those third-party themes. Theme availability, compatibility and licensing must be checked on each publisher’s official site.

## Run locally

Requirements: Node.js 20.9+ and npm.

```bash
npm install
npm run dev
```

Run the automated configuration API tests with:

```bash
npm test
```

Open http://localhost:3000.

## WordPress connection test

Create a dedicated WordPress user with only the permissions needed for the intended workflow. Create a revocable Application Password from that user's profile, then enter the HTTPS site URL, username, and Application Password in the dashboard.

Do not use your main administrator password. The connection endpoint does not persist credentials. The separate “Create starter pages” action makes real WordPress changes after a confirmation: it creates missing standard categories and publishes About, Contact, and Privacy Policy starter pages. Existing pages with matching slugs are left unchanged. Review and replace the Contact and Privacy Policy starter text before public launch.

Before production multi-tenant use, add authentication and authorization, rate limiting, audit logging, SSRF protections (including DNS/IP validation and redirect controls), and a documented encrypted credential lifecycle. Do not store customer credentials until these controls exist.

## Current limitations — be transparent

- Template preview and configuration generation do not install a WordPress theme.
- The WordPress integration can test access and create starter categories/pages, but it does not install themes, build custom menus, configure a homepage, publish news articles, or provision hosting.
- AI customization is not connected to an AI provider yet. The template-first configuration path does not require an AI API key.
- User accounts, billing, secure multi-tenant project storage, hosting provisioning, custom-domain automation, and SSL provisioning are not implemented yet.
- The latest observed Vercel production deployment reached READY. CI and runtime checks should still be monitored on each new commit.

## Roadmap

1. Expand automated coverage to current-state export behavior and live WordPress API behavior with controlled test fixtures.
2. Run and verify the production build and CI checks after each meaningful change.
3. Build a minimal WordPress plugin/adapter for applying approved settings and creating pages.
4. Add secure accounts, project persistence, and encrypted credential handling.
5. Integrate a real hosting provider for new WordPress site provisioning.
6. Add an optional, verified AI provider for natural-language design changes.
7. Add billing, quotas, backups, monitoring, and customer support tooling.


## Homepage and studio experience

- The public homepage at `/` introduces NewsForge, explains the current workflow and links visitors into the builder.
- The existing website builder now lives at `/studio`; its template search, live layout preview, configuration export and WordPress starter-page workflow are preserved.
- The homepage includes responsive navigation, feature explanations, template-style cards, a three-step workflow and a clear statement of current product limits.
- Homepage template cards are illustrative design previews. They are not claims that a complete production WordPress theme is installed or provisioned.

## Editable news navigation

- Add and remove up to 12 custom news categories in the studio; duplicate names are blocked in the interface and empty names are ignored.
- Edit the homepage lead headline, short introduction, and breaking-news ticker text; these values update the preview and are included in exported JSON configuration.
- Validate and normalize homepage copy server-side, with character limits of 160 for headlines, 240 for descriptions, and 180 for ticker text.
- Category names are normalized and length-limited by the server before they enter the generated JSON configuration.
- The first six configured categories appear in the visual navigation preview, and the same category list is included when exporting the configuration.


## Named news-publisher inspiration

The public homepage includes a **Newsroom Inspiration** directory with clickable names for NDTV, Bhadko News Network, B India, Khabar Ki Tahak, TV9 Gujarati, ABP Asmita, Divya Bhaskar and Zee 24 Kalak. The links are references for visitors to explore, not affiliations or endorsements. The cards use original NewsForge styling and do not copy third-party logos or claim the referenced sites are NewsForge customers. The builder still creates its own original preview layouts; it does not clone or automatically reproduce these publishers' websites.

## Full news-page preview and share links

- After generating a configuration in Studio, use **Full preview** to open a branded, responsive website preview at `/preview`.
- The preview includes the homepage layout, category-page layouts for configured navigation items, an article-detail template, and About, Contact, and Privacy Policy page structures.
- **Copy preview link** creates a shareable URL that contains the generated public design configuration. It can be opened on another device without logging into Studio.
- Preview pages intentionally use empty content slots and clearly labelled placeholders instead of fabricated breaking news, article headlines, authors, or publication dates.
- The preview link is a shareable design preview on the existing NewsForge deployment, not a separately provisioned customer domain. The configuration is encoded in the URL; it is not saved to a database, does not expire automatically, and should not contain private information.
- This is the first step toward a ZipWP-style flow, not complete automatic website provisioning. The current app does not yet create a WordPress theme, publish news articles, store user projects, provision customer-specific subdomains, or manage temporary hosting/SSL lifecycle.
- For a public production site today, connect a real WordPress installation and hosting account separately. Review all starter pages and replace placeholder content before launch.

## Temporary preview hosting: current and next step

Current: the preview route is served by the existing Vercel deployment at `/preview`. A copied link shares the generated design configuration on that domain. No new Vercel project, customer subdomain, database record, or WordPress install is created by this action.

Next for true temporary customer sites: add authenticated project storage, expiry timestamps and cleanup, per-project access controls, a hosting/provisioning adapter, subdomain assignment, SSL verification, rate limits, and a user-approved publish/teardown flow. Do not claim that a customer site has been independently hosted until those services are integrated and verified.



## Database-backed previews, expiry and publishing

The saved-project workflow is implemented in the app code and requires one-time deployment setup before it can work in production.

### 1. Configure Neon Postgres

1. Create a Postgres database in Neon and copy its pooled connection string.
2. Add `DATABASE_URL` to the Vercel project environment variables for Production and Preview.
3. Run the SQL in `database/schema.sql` once against that database. It creates the project table and expiry/domain indexes.
4. Redeploy after setting environment variables.

The Studio's **Save project & create preview** action stores the normalized configuration and a database-generated UUID project ID, creates a unique slug, and sets a 24-hour expiry. A random management token is returned once to the browser; only its SHA-256 hash is stored in the database. Keep the browser session used to manage the project. The public preview does not expose the management token.

### 2. Configure wildcard preview subdomains (optional)

To use `https://<slug>.preview.yourdomain.com`:

1. Add `preview.yourdomain.com` as a domain for this Vercel project.
2. Configure DNS for `*.preview.yourdomain.com` to point to the Vercel project as instructed in Vercel's Domains settings.
3. Add `PREVIEW_BASE_DOMAIN=preview.yourdomain.com` to Vercel environment variables and redeploy.

Until this is configured, saved previews use the existing deployment URL in the form `/preview?project=<slug>`. The middleware routes wildcard subdomains to the saved project, and the server checks the database on each request. An expired or unknown slug is not served.

### 3. Scheduled cleanup

Add a random secret as `CRON_SECRET` in Vercel environment variables. The Vercel Cron Job calls `/api/cron/cleanup-previews` with the required bearer secret and deletes expired, unpublished preview records. The configured schedule runs daily, which is compatible with Vercel Hobby cron limits; an expired link is rejected immediately by the read API even before the next cleanup run. Check the current cron limits for your Vercel plan before changing the cadence.

### 4. Publish and connect a custom domain

- **Publish permanently** disables the expiry timestamp. The website stays served by this NewsForge deployment; this does not provision a separate WordPress installation or separate Vercel project.
- To connect a custom domain through Vercel's API, set `VERCEL_TOKEN`, `VERCEL_PROJECT_ID`, and (for a team project) `VERCEL_TEAM_ID` in server-only Vercel environment variables. Never put these values in client-side code.
- Enter a domain you own, click **Connect**, configure the exact DNS/ownership instructions shown in Vercel Settings → Domains, then click **Verify domain after DNS setup**. Only verified domains are mapped to a saved project.
- The domain route and permanent-publish actions require the one-time management token returned when the project is saved. This MVP has no user accounts or recovery flow for that token, so keep the browser session open until domain setup is complete.

### Required environment variables

| Variable | Purpose |
| --- | --- |
| `DATABASE_URL` | Neon Postgres connection string |
| `CRON_SECRET` | Authorizes scheduled expiry cleanup |
| `PREVIEW_BASE_DOMAIN` | Optional wildcard base domain, without protocol |
| `VERCEL_TOKEN` | Server-only token for domain API actions |
| `VERCEL_PROJECT_ID` | Vercel project receiving customer domains |
| `VERCEL_TEAM_ID` | Optional Vercel team ID |
| `APP_PRIMARY_DOMAIN` | Optional main NewsForge domain to exclude from custom-domain routing |

### Important production limits

This is database-backed shared hosting on one Next.js deployment, not isolated customer infrastructure. A permanent publish currently means “keep this saved configuration available without expiry.” It does not create a separate codebase, install a WordPress theme, publish live articles, or provide per-customer server isolation. Before taking paying customers, add user accounts, ownership/recovery for management tokens, rate limiting, abuse monitoring, quotas, domain teardown, backups, and end-to-end deployment tests. Vercel must also have the wildcard and customer domains attached and verified; source code alone cannot create DNS records or prove domain ownership.


## Guided builder UX update

- Refined the Studio introduction around a clear, three-step website-building flow: customise, preview, and connect WordPress.
- Made the progress steps interactive so users can jump directly to brand settings, the live preview, or WordPress connection setup.
- Added keyboard-visible focus states, clearer hover feedback, smoother control transitions, and reduced-motion support.
- Improved mobile spacing and step navigation while preserving the existing template library, live preview, configuration export, saved-project controls, and WordPress integration.
- This is an original NewsForge interface inspired by guided website-builder usability patterns; it does not copy ZipWP branding or imply that full WordPress hosting/theme provisioning is available.
