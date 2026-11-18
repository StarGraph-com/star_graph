# star_graph
## StarGraph is a real-time collabrative diagraming platform developed by Astar

## Run locally

Copy `backend/.env.example` to `backend/.env` and fill in your Supabase project URL and publishable key. Enable email and password authentication in Supabase. If email confirmation is required, confirm your account before signing in.

In one terminal, start the backend:

```sh
cd backend
npm ci
npm run start:dev -- --env-file .env
```

In another terminal, start the frontend:

```sh
cd frontend
npm ci
npm run dev
```

Open [StarGraph](http://localhost:3000). The frontend calls the backend at `http://127.0.0.1:3001` by default. To use a different backend address, set `BACKEND_URL` in `frontend/.env.local` or in the frontend server's environment.
