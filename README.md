# Scout-Report

Combined scout reports for @LathyFlora — pest and disease monitoring for agricultural farms.

## Quick Start

```bash
npm install
npm start
```

Open [http://localhost:3000](http://localhost:3000) for the preview hub, or go directly to:

- [http://localhost:3000/user-form.html](http://localhost:3000/user-form.html) — Scout report submission form
- [http://localhost:3000/admin-dashboard.html](http://localhost:3000/admin-dashboard.html) — Admin dashboard

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/farms` | List available farms |
| GET | `/crop-types` | List crop types |
| GET | `/crop-types/:id/varieties` | Varieties for a crop type |
| GET | `/pests` | List common pests |
| GET | `/diseases` | List common diseases |
| GET | `/scout-reports` | List reports (supports `farm`, `status`, `dateFrom`, `dateTo` query params) |
| GET | `/scout-reports/stats` | Dashboard statistics |
| GET | `/scout-reports/:id` | Get a single report |
| POST | `/scout-reports` | Create a new scout report |
| POST | `/scout-reports/:id/pest-observations` | Add pest observation to a report |
| POST | `/scout-reports/:id/disease-observations` | Add disease observation to a report |
| DELETE | `/scout-reports/:id` | Delete a report |

## Project Structure

```
Scout-Report/
├── previews/           # HTML UI (form, dashboard, preview hub)
├── server/
│   ├── index.js        # Express API server
│   ├── store.js        # JSON file persistence
│   └── data/
│       ├── reference.json  # Farms, crops, pests, diseases
│       └── reports.json    # Scout reports (mutable)
└── package.json
```

## Development

```bash
npm run dev    # Start with auto-reload (Node 18+)
npm test       # Run unit tests
```

## Deployment

The included GitHub Actions workflow (`.github/workflows/azure-webapps-node.yml`) deploys to Azure App Service. Configure:

1. Set `AZURE_WEBAPP_NAME` in the workflow file
2. Add `AZURE_WEBAPP_PUBLISH_PROFILE` as a repository secret

The server listens on `process.env.PORT` (default 3000) and serves both the API and static previews.

## Contact

isaacmunyua01@gmail.com
