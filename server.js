const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const path = require('path');
// Database: support SQLite (default) or Postgres when DATABASE_URL is provided
let usePostgres = false;
let sqliteDb = null;
let pgPool = null;

if (process.env.DATABASE_URL) {
  // Use Postgres
  usePostgres = true;
  const { Pool } = require('pg');
  pgPool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: process.env.PGSSLMODE ? { rejectUnauthorized: false } : false });

  // Initialize table in Postgres
  (async () => {
    const client = await pgPool.connect();
    try {
      await client.query(`CREATE TABLE IF NOT EXISTS logs (
        id SERIAL PRIMARY KEY,
        date TEXT NOT NULL,
        exercise TEXT NOT NULL,
        max_weight REAL NOT NULL,
        max_reps INTEGER NOT NULL
      );`);
      await client.query(`CREATE TABLE IF NOT EXISTS meta (
        key TEXT PRIMARY KEY,
        value TEXT
      );`);
      console.log('Initialized Postgres tables');
    } catch (err) {
      console.error('Error initializing Postgres tables', err);
    } finally {
      client.release();
    }
  })();
} else {
  // Fallback: SQLite
  const sqlite3 = require('sqlite3').verbose();
  const DB_PATH = path.join(__dirname, 'db', 'coach.db');
  sqliteDb = new sqlite3.Database(DB_PATH);

  // Initialize DB
  sqliteDb.serialize(() => {
    sqliteDb.run(`CREATE TABLE IF NOT EXISTS logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      date TEXT NOT NULL,
      exercise TEXT NOT NULL,
      max_weight REAL NOT NULL,
      max_reps INTEGER NOT NULL
    );`);

    sqliteDb.run(`CREATE TABLE IF NOT EXISTS meta (
      key TEXT PRIMARY KEY,
      value TEXT
    );`);
  });
}

const app = express();
app.use(cors());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));

// Endpoints
app.get('/api/logs', (req, res) => {
  if (usePostgres) {
    pgPool.query('SELECT * FROM logs ORDER BY date DESC', [])
      .then(r => res.json(r.rows))
      .catch(err => res.status(500).json({ error: err.message }));
  } else {
    sqliteDb.all('SELECT * FROM logs ORDER BY date DESC', [], (err, rows) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json(rows);
    });
  }
});

app.post('/api/logs', (req, res) => {
  const { date, exercise, max_weight, max_reps } = req.body;
  if (!date || !exercise || !max_weight || !max_reps) {
    return res.status(400).json({ error: 'Missing fields' });
  }
  if (usePostgres) {
    pgPool.query('INSERT INTO logs (date, exercise, max_weight, max_reps) VALUES ($1,$2,$3,$4) RETURNING id', [date, exercise, max_weight, max_reps])
      .then(r => res.json({ id: r.rows[0].id }))
      .catch(err => res.status(500).json({ error: err.message }));
  } else {
    const stmt = sqliteDb.prepare('INSERT INTO logs (date, exercise, max_weight, max_reps) VALUES (?, ?, ?, ?)');
    stmt.run(date, exercise, max_weight, max_reps, function(err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ id: this.lastID });
    });
    stmt.finalize();
  }
});

// Simple route for retrieving coaching plan and recommended macros for the user (fixed inputs used client-side too)
app.get('/api/plan', (req, res) => {
  // Note: frontend contains the full generated plans; this endpoint returns meta for calorie calculator defaults.
  res.json({ weightKg:60, heightCm:184, age:25, sex:'male' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server listening on http://localhost:${PORT}`));
