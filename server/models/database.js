const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, '..', 'studybuddy.db');

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error opening database:', err.message);
  } else {
    console.log('Connected to SQLite database');
  }
});

// Enable foreign keys
db.run('PRAGMA foreign_keys = ON');

// Initialize tables
const initializeDatabase = () => {
  return new Promise((resolve, reject) => {
    db.serialize(() => {
      // Users table
      db.run(`
        CREATE TABLE IF NOT EXISTS users (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          email TEXT UNIQUE NOT NULL,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `);

      // Courses table
      db.run(`
        CREATE TABLE IF NOT EXISTS courses (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          user_id INTEGER,
          name TEXT NOT NULL,
          description TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
        )
      `);

      // Notes table
      db.run(`
        CREATE TABLE IF NOT EXISTS notes (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          course_id INTEGER NOT NULL,
          title TEXT NOT NULL,
          body TEXT,
          summary TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (course_id) REFERENCES courses (id) ON DELETE CASCADE
        )
      `, (err) => {
        if (err) {
          reject(err);
        } else {
          // Add pdf_path column if it doesn't exist (for existing databases)
          db.run(`
            ALTER TABLE notes ADD COLUMN pdf_path TEXT
          `, (alterErr) => {
            // Ignore error if column already exists
            if (alterErr && !alterErr.message.includes('duplicate column name')) {
              console.log('Note: Could not add pdf_path column (may already exist):', alterErr.message);
            }
            // Add is_reviewed column for study progress tracking
            db.run(`
              ALTER TABLE notes ADD COLUMN is_reviewed INTEGER DEFAULT 0
            `, (reviewErr) => {
              if (reviewErr && !reviewErr.message.includes('duplicate column name')) {
                console.log('Note: Could not add is_reviewed column:', reviewErr.message);
              }
              // Add quiz column for AI-generated quizzes
              db.run(`
                ALTER TABLE notes ADD COLUMN quiz TEXT
              `, (quizErr) => {
                if (quizErr && !quizErr.message.includes('duplicate column name')) {
                  console.log('Note: Could not add quiz column:', quizErr.message);
                }
                console.log('Database tables initialized successfully');
                resolve();
              });
            });
          });
        }
      });
    });
  });
};

module.exports = {
  db,
  initializeDatabase
};
