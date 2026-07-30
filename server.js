const express = require('express');
const app = express();

// Middleware
app.use(express.json());

// Connection & Model imports
const pool = require('./db');
const connectMongo = require('./dbMongo');
const UserMongo = require('./models/UserMongo');
const PostMongo = require('./models/PostMongo');

// Connect Databases
connectMongo();

// ==========================================
// MONGODB USER ROUTES
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
// MONGODB POST ROUTES (Day 20 - Relationships & Populate)
// ==========================================

// 1. CREATE: Create a post referencing a user ID
app.post('/api/mongo/posts', async (req, res) => {
  try {
    const post = await PostMongo.create(req.body);
    res.status(201).json({ success: true, data: post });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

// 2. READ: Get all posts populated with author details
app.get('/api/mongo/posts', async (req, res) => {
  try {
    const posts = await PostMongo.find()
      .populate('author', 'name email')
      .sort({ createdAt: -1 });

    res.json({ success: true, count: posts.length, data: posts });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ==========================================
// START SERVER (Always at the very bottom)
// ==========================================
const PORT = process.env.PORT || 5000;
// ==========================================
// MONGODB AGGREGATION ROUTES
// ==========================================

// GET /api/mongo/analytics/skills -> Aggregates skill counts across all users
app.get('/api/mongo/analytics/skills', async (req, res) => {
  try {
    const skillStats = await UserMongo.aggregate([
      // Stage 1: Deconstruct skills array (1 user document -> N skill documents)
      { $unwind: '$skills' },

      // Stage 2: Group by skill name and calculate count
      {
        $group: {
          _id: '$skills',            // Group key
          totalDevelopers: { $sum: 1 } // Increment count by 1 for each match
        }
      },

      // Stage 3: Sort by total developers descending (-1)
      { $sort: { totalDevelopers: -1 } },

      // Stage 4: Reshape output fields cleanly
      {
        $project: {
          _id: 0,                   // Exclude default _id field
          skill: '$_id',             // Rename _id to skill
          totalDevelopers: 1
        }
      }
    ]);

    res.json({ success: true, count: skillStats.length, data: skillStats });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});
app.listen(PORT, () => {
  console.log(`Server listening on http://localhost:${PORT}`);
});