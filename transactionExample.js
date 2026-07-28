const pool = require('./db');

async function createPostAndIncrementUserStats(userId, title, content) {
  // Grab a dedicated client connection from the pool
  const client = await pool.connect();

  try {
    // 1. START TRANSACTION
    await client.query('BEGIN');

    // Query 1: Insert the new post
    const postQuery = `
      INSERT INTO posts (title, content, user_id) 
      VALUES ($1, $2, $3) 
      RETURNING *;
    `;
    const postResult = await client.query(postQuery, [title, content, userId]);

    // Query 2: Simulate another critical operation (e.g., logging an action)
    // If this query fails, step 1 is automatically undone!
    const logQuery = `
      INSERT INTO user_logs (user_id, action) 
      VALUES ($1, $2);
    `;
    // For demonstration, let's assume logQuery executes...

    // 2. COMMIT TRANSACTION (Permanently save all changes)
    await client.query('COMMIT');
    console.log(' Transaction completed successfully!');
    return postResult.rows[0];

  } catch (error) {
    // 3. ROLLBACK TRANSACTION (Undo everything if an error occurs)
    await client.query('ROLLBACK');
    console.error(' Transaction failed! Rolled back changes.', error.message);
    throw error;

  } finally {
    // Always release the client back to the pool
    client.release();
  }
}