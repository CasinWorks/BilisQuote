# BilisQuote

A simple **quotation + invoice** web app for contractors.

## Features

- Client profiles
- Quotations and invoices with auto numbering
- Scope of work table (Description / Details / Amount)
- Milestone-based payment schedule (percent or exact amount downpayment)
- Withholding tax toggle
- Bank details section (PH banks incl. BPI, RCBC)
- PDF download
- CSV exports (quotes/invoices)
- Dashboard with monthly totals + forecast
- Full backup/migration via JSON export/import

## Run locally

```bash
npm install
npm run dev
```

Default login: **admin / admin** (change via Vercel env vars `VITE_AUTH_USERNAME` and `VITE_AUTH_PASSWORD`).

You can also install [eslint-plugin-react-x](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-x) and [eslint-plugin-react-dom](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-dom) for React-specific lint rules:

```js
// eslint.config.js
import reactX from 'eslint-plugin-react-x'
import reactDom from 'eslint-plugin-react-dom'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...
      // Enable lint rules for React
      reactX.configs['recommended-typescript'],
      // Enable lint rules for React DOM
      reactDom.configs.recommended,
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```
