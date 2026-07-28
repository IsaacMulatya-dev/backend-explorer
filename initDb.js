const pool = require('./db');

const createTableQuery = `
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(150) UNIQUE NOT NULL,
  role VARCHAR(50) DEFAULT 'developer',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
`;

async function initDatabase() {
  try {
    await pool.query(createTableQuery);
    console.log(" Table 'users' created or already exists!");
  } catch (error) {
    console.error(" Error creating table:", error.message);
  } finally {
    pool.end();
  }
}

initDatabase();