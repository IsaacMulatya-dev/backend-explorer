const pool = require('./db');

const createPostsTableQuery = `
CREATE TABLE IF NOT EXISTS posts (
  id SERIAL PRIMARY KEY,
  title VARCHAR(200) NOT NULL,
  content TEXT NOT NULL,
  user_id INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  -- Foreign Key Constraint linking user_id to the users table
  CONSTRAINT fk_user
    FOREIGN KEY(user_id) 
    REFERENCES users(id)
    ON DELETE CASCADE
);
`;

async function createTables() {
  try {
    await pool.query(createPostsTableQuery);
    console.log(" 'posts' table created successfully with Foreign Key link!");
  } catch (error) {
    console.error(" Error creating posts table:", error.message);
  } finally {
    pool.end();
  }
}

createTables();