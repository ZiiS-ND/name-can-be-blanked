import express, { NextFunction, Request, Response } from "express";
import Database from "better-sqlite3";

const PORT = Number(process.env.PORT) || 3000;
const DB_FILE = process.env.DB_FILE || "tasks.db";
const STATUSES = ["todo", "doing", "done"] as const;
type Status = (typeof STATUSES)[number];

interface Task {
  id: number;
  title: string;
  description: string;
  status: Status;
  created_at: string;
}

const db = new Database(DB_FILE);
db.exec(`
  CREATE TABLE IF NOT EXISTS tasks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    description TEXT NOT NULL DEFAULT '',
    status TEXT NOT NULL DEFAULT 'todo',
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  )
`);

class HttpError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

const isStatus = (v: unknown): v is Status => STATUSES.includes(v as Status);

function parseId(raw: string): number {
  const id = Number(raw);
  if (!Number.isInteger(id) || id < 1) throw new HttpError(400, "id must be a positive integer");
  return id;
}

function getTask(id: number): Task {
  const task = db.prepare("SELECT * FROM tasks WHERE id = ?").get(id) as Task | undefined;
  if (!task) throw new HttpError(404, "task not found");
  return task;
}

function validate(body: any, partial: boolean) {
  const { title, description, status } = body ?? {};
  if (title !== undefined && (typeof title !== "string" || !title.trim()))
    throw new HttpError(400, "title must be a non-empty string");
  if (description !== undefined && typeof description !== "string")
    throw new HttpError(400, "description must be a string");
  if (status !== undefined && !isStatus(status))
    throw new HttpError(400, `status must be one of: ${STATUSES.join(", ")}`);
  if (!partial && title === undefined) throw new HttpError(400, "title is required");
  return { title: title?.trim(), description, status };
}

const app = express();
app.use(express.json());

// Create
app.post("/tasks", (req, res) => {
  const { title, description = "", status = "todo" } = validate(req.body, false);
  const info = db
    .prepare("INSERT INTO tasks (title, description, status) VALUES (?, ?, ?)")
    .run(title, description, status);
  res.status(201).json(getTask(Number(info.lastInsertRowid)));
});

// List, filters: ?status=todo&q=keyword&limit=20&offset=0
app.get("/tasks", (req, res) => {
  const { status, q } = req.query;
  const limit = Math.min(Number(req.query.limit) || 20, 100);
  const offset = Number(req.query.offset) || 0;

  const where: string[] = [];
  const params: (string | number)[] = [];
  if (status !== undefined) {
    if (!isStatus(status)) throw new HttpError(400, `status must be one of: ${STATUSES.join(", ")}`);
    where.push("status = ?");
    params.push(status);
  }
  if (typeof q === "string" && q) {
    where.push("title LIKE ?");
    params.push(`%${q}%`);
  }
  const clause = where.length ? `WHERE ${where.join(" AND ")}` : "";

  const total = (db.prepare(`SELECT COUNT(*) AS n FROM tasks ${clause}`).get(...params) as { n: number }).n;
  const items = db
    .prepare(`SELECT * FROM tasks ${clause} ORDER BY id LIMIT ? OFFSET ?`)
    .all(...params, limit, offset);
  res.json({ total, items });
});

// Get one
app.get("/tasks/:id", (req, res) => {
  res.json(getTask(parseId(req.params.id)));
});

// Update (partial)
app.patch("/tasks/:id", (req, res) => {
  const id = parseId(req.params.id);
  const current = getTask(id);
  const { title, description, status } = validate(req.body, true);
  db.prepare("UPDATE tasks SET title = ?, description = ?, status = ? WHERE id = ?").run(
    title ?? current.title,
    description ?? current.description,
    status ?? current.status,
    id,
  );
  res.json(getTask(id));
});

// Delete
app.delete("/tasks/:id", (req, res) => {
  const id = parseId(req.params.id);
  getTask(id);
  db.prepare("DELETE FROM tasks WHERE id = ?").run(id);
  res.status(204).end();
});

app.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
  if (err instanceof HttpError) return res.status(err.status).json({ error: err.message });
  if (err instanceof SyntaxError) return res.status(400).json({ error: "invalid JSON body" });
  console.error(err);
  res.status(500).json({ error: "internal server error" });
});

app.listen(PORT, () => console.log(`Listening on http://localhost:${PORT}`));
