## Milestone: Scaffolding — React/Vite frontend

> **Validates:**
> - `cd src/Stretto.Web && npm install && npm test` exits 0 and reports at least 1 passing test
> - `cd src/Stretto.Web && npm run build` exits 0 (frontend builds without errors)

> **Reference files:**
> This milestone follows milestone-01a-dotnet-scaffolding which establishes the backend. The builder establishes the frontend patterns that all future milestones will follow.

- [x] Scaffold `src/Stretto.Web` as a Vite + React + TypeScript project using `npm create vite@latest` with the `react-ts` template; set `strict: true` in `tsconfig.json`; replace the default `App.tsx` with a minimal placeholder rendering `<h1>Stretto</h1>` on a root route `/`; add `react-router-dom` and wire `<BrowserRouter>` in `main.tsx`
- [ ] Add Tailwind CSS to `src/Stretto.Web`: install `tailwindcss`, `postcss`, and `autoprefixer`; run `npx tailwindcss init -p`; configure `tailwind.config.js` content paths to `["./index.html","./src/**/*.{ts,tsx}"]`; add `@tailwind base/components/utilities` directives to `src/index.css`
- [ ] Add shadcn/ui to `src/Stretto.Web`: run `npx shadcn@latest init` with default style (New York), base color (Neutral), and CSS variables enabled; this creates `components.json` and `src/lib/utils.ts`
- [ ] Add ESLint and Prettier to `src/Stretto.Web`: install `eslint`, `@typescript-eslint/eslint-plugin`, `@typescript-eslint/parser`, `eslint-plugin-react`, `eslint-plugin-react-hooks`, `prettier`, and `eslint-config-prettier`; add `.eslintrc.cjs` extending `plugin:@typescript-eslint/recommended` and `prettier`; add `.prettierrc` with `{ "semi": true, "singleQuote": true, "printWidth": 100 }`; add `"lint"` and `"format"` scripts to `package.json`
- [ ] Install Vitest and React Testing Library in `src/Stretto.Web`: add `vitest`, `@vitest/ui`, `jsdom`, `@testing-library/react`, `@testing-library/jest-dom`, and `@testing-library/user-event` as dev dependencies; configure `test` in `vite.config.ts` with `environment: 'jsdom'` and `setupFiles: ['./src/setupTests.ts']`; create `src/setupTests.ts` importing `@testing-library/jest-dom`; add `"test": "vitest run"` script to `package.json`; add a placeholder test `src/App.test.tsx` that renders `<App />` inside a `MemoryRouter` and asserts the heading `Stretto` is visible
- [ ] Install `openapi-typescript-codegen` in `src/Stretto.Web` as a dev dependency; add a `"generate"` script to `package.json`: `"openapi --input http://localhost:5000/swagger/v1/swagger.json --output src/api/generated --client axios"`; create the empty directory `src/api/generated/.gitkeep` so the output path is committed
