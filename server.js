const express = require('express');
const app = express();

// Middleware
app.use(express.json());

// Connection imports
const pool = require('./db');
const connectMongo = require('./dbMongo');
const UserMongo = require('./models/UserMongo');

// Connect Databases
connectMongo();

// ==========================================
// MONGODB FULL CRUD ROUTES
// ==========================================

// 1. CREATE: Add a new user document
app.post('/api/mongo/users', async (req, res) => {
  try {
    const user = await UserMongo.create(req.body);
    res.status(201).json({ success: true, data: user });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(400).json({ success: false, error: 'Email already exists' });
    }
    res.status(400).json({ success: false, error: err.message });
  }
});

// 2. READ: Get all user documents
app.get('/api/mongo/users', async (req, res) => {
  try {
    const users = await UserMongo.find().sort({ createdAt: -1 });
    res.json({ success: true, count: users.length, data: users });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 3. READ: Get single user document by ID
app.get('/api/mongo/users/:id', async (req, res) => {
  try {
    const user = await UserMongo.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    res.json({ success: true, data: user });
  } catch (err) {
    if (err.kind === 'ObjectId') {
      return res.status(400).json({ success: false, error: 'Invalid document ID format' });
    }
    res.status(500).json({ success: false, error: err.message });
  }
});

// 4. UPDATE: Modify user document by ID
app.put('/api/mongo/users/:id', async (req, res) => {
  try {
    const user = await UserMongo.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    res.json({ success: true, data: user });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

// 5. DELETE: Remove user document by ID
app.delete('/api/mongo/users/:id', async (req, res) => {
  try {
    const user = await UserMongo.findByIdAndDelete(req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    res.json({ success: true, message: 'User deleted successfully' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ==========================================
// START SERVER (Always at the bottom)
// ==========================================
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server listening on http://localhost:${PORT}`);
});