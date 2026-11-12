# Fieldnotes

Note-taking for field researchers, built as an npm workspaces monorepo.

| Workspace     | What it is                                                                                                                           | Port |
| ------------- | ------------------------------------------------------------------------------------------------------------------------------------ | ---- |
| `apps/web`    | Researcher app (React + Vite): sign-in, notebooks, notes, sharing, profile settings and an AI research assistant panel.              | 5173 |
| `apps/admin`  | Admin portal (React + Vite): users table with role and status changes, billing form. Admins only.                                    | 5174 |
| `apps/api`    | Express API serving `/api/*`: sessions, notebooks and notes CRUD, admin users and billing, and an assistant route that calls OpenAI. | 5000 |
| `packages/ui` | Shared React components and styles used by both apps.                                                                                |      |

## Run it

```bash
npm install
npm run dev:api     # http://localhost:5000
npm run dev:web     # http://localhost:5173
npm run dev:admin   # http://localhost:5174
```

Sign in with any seeded user and the password `fieldnotes`:

| Email                 | Role       |
| --------------------- | ---------- |
| `grace@fieldlab.test` | researcher |
| `alan@fieldlab.test`  | researcher |
| `ada@fieldlab.test`   | admin      |

The assistant calls OpenAI when `OPENAI_API_KEY` is set (model from `OPENAI_MODEL`, default `gpt-4o-mini`) and replies with a not-configured message otherwise. Data lives in memory and resets when the API restarts.

```bash
npm run typecheck   # every workspace
npm run build       # api to dist/, apps to dist/
```
