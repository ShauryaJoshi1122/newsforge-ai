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
