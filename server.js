const express = require('express');
const pool = require('./db');

const app = express();
app.use(express.json()); // Parse incoming JSON bodies

// ==========================================
// USER ROUTES (Primary Entity)
// ==========================================

// 1. CREATE: Add a new user
app.post('/api/users', async (req, res) => {
  const { name, email, role } = req.body;
  try {
    const result = await pool.query(
      `INSERT INTO users (name, email, role) VALUES ($1, $2, $3) RETURNING *`,
      [name, email, role || 'developer']
    );
    res.status(201).json({ success: true, data: result.rows[0] });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

// 2. READ: Get all users
app.get('/api/users', async (req, res) => {
  try {
    const result = await pool.query(`SELECT * FROM users ORDER BY id ASC`);
    res.json({ success: true, count: result.rowCount, data: result.rows });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 3. READ: Get single user by ID
app.get('/api/users/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query(`SELECT * FROM users WHERE id = $1`, [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    res.json({ success: true, data: result.rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ==========================================
// POST ROUTES (Relational / Foreign Key Entity)
// ==========================================

// 4. CREATE: Add a post linked to a user_id
app.post('/api/posts', async (req, res) => {
  const { title, content, user_id } = req.body;
  try {
    const result = await pool.query(
      `INSERT INTO posts (title, content, user_id) VALUES ($1, $2, $3) RETURNING *`,
      [title, content, user_id]
    );
    res.status(201).json({ success: true, data: result.rows[0] });
  } catch (err) {
    // Check if the error is a Foreign Key violation (user_id doesn't exist)
    if (err.code === '23503') {
      return res.status(400).json({ 
        success: false, 
        error: `User with ID ${user_id} does not exist.` 
      });
    }
    res.status(400).json({ success: false, error: err.message });
  }
});

// 5. READ: Get all posts with author details using INNER JOIN
app.get('/api/posts', async (req, res) => {
  try {
    const query = `
      SELECT 
        posts.id AS post_id,
        posts.title,
        posts.content,
        posts.created_at,
        users.name AS author_name,
        users.email AS author_email
      FROM posts
      INNER JOIN users ON posts.user_id = users.id
      ORDER BY posts.created_at DESC;
    `;
    const result = await pool.query(query);
    res.json({ success: true, count: result.rowCount, data: result.rows });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ==========================================
// SERVER INITIALIZATION (Must be at the end)
// ==========================================
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server listening on http://localhost:${PORT}`);
});