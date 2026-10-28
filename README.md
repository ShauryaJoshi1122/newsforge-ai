# NewsForge AI

NewsForge AI is an early-stage, template-first news website generator. It is designed to grow into a SaaS product that creates branded news websites and connects them to real WordPress installations.

## Current MVP

- Responsive dashboard with six reusable news template choices.
- Branding controls for news brand name, language, and primary color.
- Feature toggles for breaking ticker, live TV section, ad slots, and social links.
- Live design preview that updates as settings change.
- Server-side, validated website configuration generation at POST /api/generate.
- Export of generated configuration as a JSON file.
- WordPress authentication test at POST /api/wordpress using HTTPS and a revocable WordPress Application Password.
- Clear UI messaging: generating a configuration is not the same as publishing a website.

## Run locally

Requirements: Node.js 20.9+ and npm.

```bash
npm install
npm run dev
```

Open http://localhost:3000.

## WordPress connection test

Create a dedicated WordPress user with only the permissions needed for the intended workflow. Create a revocable Application Password from that user's profile, then enter the HTTPS site URL, username, and Application Password in the dashboard.

Do not use your main administrator password. The connection endpoint currently uses the supplied credentials only to test access and does not persist them or change content.

Before production multi-tenant use, add authentication and authorization, rate limiting, audit logging, SSRF protections (including DNS/IP validation and redirect controls), and a documented encrypted credential lifecycle. Do not store customer credentials until these controls exist.

## Current limitations — be transparent

- Template preview and configuration generation do not install a WordPress theme.
- The WordPress integration currently tests authentication only; it does not create pages, menus, categories, or publish content.
- AI customization is not connected to an AI provider yet. The template-first configuration path does not require an AI API key.
- User accounts, billing, secure multi-tenant project storage, hosting provisioning, custom-domain automation, and SSL provisioning are not implemented yet.
- The first Vercel production build completed successfully. ESLint configuration and CI checks are being tightened in follow-up commits; verify the latest deployment before relying on it.

## Roadmap

1. Run a production build and fix any errors.
2. Add tests for configuration generation and WordPress connection validation.
3. Build a minimal WordPress plugin/adapter for applying approved settings and creating pages.
4. Add secure accounts, project persistence, and encrypted credential handling.
5. Integrate a real hosting provider for new WordPress site provisioning.
6. Add an optional, verified AI provider for natural-language design changes.
7. Add billing, quotas, backups, monitoring, and customer support tooling.
