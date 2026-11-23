# Walletix Web (Angular 21 + Angular Material)

Web application of Walletix, consuming the Walletix RESTful API (Spring Boot).

## Run it

```bash
npm install
npm start            # http://localhost:4200 (uses the API at http://localhost:8080)
npm test             # unit + security tests (Vitest)
npm run build        # production build (uses the API deployed on Render)
```

The API URL is in `src/environments/environment.development.ts` (local) and
`src/environments/environment.ts` (production).

## Deployment

- **Web app:** https://pierochlz.github.io/walletix-web/
- **API:** https://walletix-jbsb.onrender.com (Swagger: `/swagger-ui/index.html`)

Every push to `main` runs `.github/workflows/deploy.yml`: install, tests, production build
and publish to GitHub Pages. The free API instance sleeps when idle, so the first request
can take up to a minute.

## Branching (GitFlow) and commits

- `main`: what is deployed. Only receives merges from `develop` (or `hotfix/*`).
- `develop`: integration branch. New work goes in `feature/<name>` branches created from `develop`.
- Commits follow [Conventional Commits](https://www.conventionalcommits.org/) (`feat:`, `fix:`, `docs:`, `test:`...).
- Releases are tagged with [Semantic Versioning](https://semver.org/) (`v1.0.0`).

## What is inside

| Requirement (final project) | Where |
| --- | --- |
| Login / register with JWT | `pages/auth`, `core/auth.service.ts` |
| Token sent on every request, 401 closes the session | `core/auth.interceptor.ts` |
| Private routes | `core/auth.guard.ts`, `app.routes.ts` |
| CRUD with Angular Material (table, sort, filter, paginator, dialogs, reactive forms) | `shared/resource-page.*`, `shared/resource-form-dialog.*`, `pages/resources.ts` |
| Responsive (sidenav becomes a drawer, tables become cards on phones) | `pages/layout`, `styles.css` |
| Third-party service: ExchangeRate-API | `core/exchange-rate.service.ts`, dashboard |
| i18n en-US / es-419 (texts, numbers, dates, currency, paginator) | `core/i18n` |
| Accessibility: skip link, `lang` attribute, ARIA labels, visible focus, `role="alert"` | templates + `styles.css` |
| Terms and conditions in the footer | `pages/terms.ts` |

## Pages

`/login`, `/register`, `/terms`, `/dashboard`, `/expenses`, `/incomes`, `/budgets`,
`/goals`, `/categories`, `/merchants`, `/profile`.

## Local test data

For local tests only, a QA database `walletix_qa` was used (never production):
user `qa.walletix@test.local`, password `Prueba123`.
