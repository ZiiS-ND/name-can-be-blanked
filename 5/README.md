# A Crude Server

ExpressJS + TypeScript CRUD API for `tasks`, persisted in SQLite (a local file, no database to install).

## Run

With Docker (simplest):

```
docker compose up --build
```

The SQLite file lives in the `tasks-data` volume, so data survives restarts. `docker compose down -v` wipes it. If port 3000 is taken, use another host port: `PORT=3001 docker compose up --build`.

Without Docker (Node 18+):

```
npm install
npm run dev
```

For a production build: `npm run build && npm start`.

Server: http://localhost:3000.

## Configuration

Environment variables, both optional:

| Variable | Default | Meaning |
|----------|---------|---------|
| `PORT` | `3000` | HTTP port |
| `DB_FILE` | `tasks.db` | SQLite file (created on first start) |

## API

A task is `{ id, title, description, status, created_at }`. `status` is `todo` (default), `doing` or `done`.

| Action | Request |
|--------|---------|
| Create | `POST /tasks` with `{ "title": "...", "description": "...", "status": "todo" }` (only `title` is required) |
| List | `GET /tasks?status=todo&q=keyword&limit=20&offset=0` returns `{ total, items }` |
| Get | `GET /tasks/:id` |
| Update | `PATCH /tasks/:id` with any of `title`, `description`, `status` |
| Delete | `DELETE /tasks/:id` returns 204 |

Errors return `{ "error": "..." }` with 400 (bad input) or 404 (not found).

## Try it

```
curl -X POST localhost:3000/tasks -H "Content-Type: application/json" -d '{"title":"Write docs"}'
curl "localhost:3000/tasks?status=todo"
curl -X PATCH localhost:3000/tasks/1 -H "Content-Type: application/json" -d '{"status":"done"}'
curl -X DELETE localhost:3000/tasks/1
```
