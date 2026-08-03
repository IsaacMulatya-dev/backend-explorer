const express = require('express');
const app = express();

// Core Middleware
app.use(express.json());

// Connection & Model Imports
const pool = require('./db');
const connectMongo = require('./dbMongo');
const UserMongo = require('./models/UserMongo');
const PostMongo = require('./models/PostMongo');

// Error Handling & Utility Imports (Day 23 & 24)
const AppError = require('./utils/AppError');
const catchAsync = require('./utils/catchAsync');
const errorHandler = require('./middleware/errorHandler');
const generateToken = require('./utils/generateToken');
const { protect } = require('./middleware/authMiddleware');

// Connect Databases
connectMongo();

// ==========================================
// MONGODB USER ROUTES
// ==========================================

// 1. CREATE: Add a new user document
app.post('/api/mongo/users', catchAsync(async (req, res, next) => {
  const user = await UserMongo.create(req.body);
  res.status(201).json({ success: true, data: user });
}));

// 2. READ: Get all user documents
app.get('/api/mongo/users', catchAsync(async (req, res, next) => {
  const users = await UserMongo.find().sort({ createdAt: -1 });
  res.json({ success: true, count: users.length, data: users });
}));

// 3. READ: Get single user document by ID
app.get('/api/mongo/users/:id', catchAsync(async (req, res, next) => {
  const user = await UserMongo.findById(req.params.id);
  if (!user) {
    return next(new AppError('User not found', 404));
  }
  res.json({ success: true, data: user });
}));

// 4. UPDATE: Modify user document by ID
app.put('/api/mongo/users/:id', catchAsync(async (req, res, next) => {
  const user = await UserMongo.findByIdAndUpdate(
    req.params.id,
    req.body,
    { new: true, runValidators: true }
  );
  if (!user) {
    return next(new AppError('User not found', 404));
  }
  res.json({ success: true, data: user });
}));

// 5. DELETE: Remove user document by ID
app.delete('/api/mongo/users/:id', catchAsync(async (req, res, next) => {
  const user = await UserMongo.findByIdAndDelete(req.params.id);
  if (!user) {
    return next(new AppError('User not found', 404));
  }
  res.json({ success: true, message: 'User deleted successfully' });
}));

// ==========================================
// MONGODB POST ROUTES
// ==========================================

// 1. CREATE: Create a post referencing a user ID
app.post('/api/mongo/posts', catchAsync(async (req, res, next) => {
  const post = await PostMongo.create(req.body);
  res.status(201).json({ success: true, data: post });
}));

// 2. READ: Get all posts populated with author details
app.get('/api/mongo/posts', catchAsync(async (req, res, next) => {
  const posts = await PostMongo.find()
    .populate('author', 'name email')
    .sort({ createdAt: -1 });

  res.json({ success: true, count: posts.length, data: posts });
}));

// ==========================================
// MONGODB AGGREGATION & PERFORMANCE ROUTES
// ==========================================

// Aggregates skill counts across all users
app.get('/api/mongo/analytics/skills', catchAsync(async (req, res, next) => {
  const skillStats = await UserMongo.aggregate([
    { $unwind: '$skills' },
    {
      $group: {
        _id: '$skills',
        totalDevelopers: { $sum: 1 }
      }
    },
    { $sort: { totalDevelopers: -1 } },
    {
      $project: {
        _id: 0,
        skill: '$_id',
        totalDevelopers: 1
      }
    }
  ]);

  res.json({ success: true, count: skillStats.length, data: skillStats });
}));

// Inspects query execution strategy
app.get('/api/mongo/performance/explain', catchAsync(async (req, res, next) => {
  const explanation = await UserMongo.find({ email: 'isaac.mongo@example.com' })
    .explain('executionStats');

  const stats = explanation.executionStats;

  res.json({
    success: true,
    executionStage: stats.executionStages.stage,
    totalDocsExamined: stats.totalDocsExamined,
    nReturned: stats.nReturned,
    executionTimeMillis: stats.executionTimeMillis
  });
}));

// ==========================================
// AUTHENTICATION ROUTES (Day 24)
// ==========================================

// 1. REGISTER USER
app.post('/api/auth/register', catchAsync(async (req, res, next) => {
  const { name, email, password } = req.body;

  const newUser = await UserMongo.create({ name, email, password });

  // Hide hashed password in output
  newUser.password = undefined;

  const token = generateToken(newUser._id);

  res.status(201).json({
    success: true,
    token,
    data: { user: newUser }
  });
}));

// 2. LOGIN USER
app.post('/api/auth/login', catchAsync(async (req, res, next) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return next(new AppError('Please provide email and password!', 400));
  }

  const user = await UserMongo.findOne({ email }).select('+password');

  if (!user || !(await user.correctPassword(password, user.password))) {
    return next(new AppError('Incorrect email or password', 401));
  }

  const token = generateToken(user._id);

  user.password = undefined;

  res.json({
    success: true,
    token,
    data: { user }
  });
}));

// 3. PROTECTED ROUTE DEMO
app.get('/api/auth/me', protect, catchAsync(async (req, res, next) => {
  res.json({
    success: true,
    data: { user: req.user }
  });
}));

// Demo custom error route
app.get('/api/mongo/users/test-error/:id', catchAsync(async (req, res, next) => {
  if (req.params.id === 'invalid') {
    return next(new AppError('This is a custom operational error test!', 400));
  }
  res.json({ success: true, message: 'Valid ID passed!' });
}));

// ==========================================
// UNHANDLED ROUTES & GLOBAL ERROR HANDLER
// ==========================================

// Handle Unhandled / 404 Routes (Catch-all middleware)
app.use((req, res, next) => {
  next(new AppError(`Cannot find ${req.originalUrl} on this server!`, 404));
});

// Global Error Handling Middleware (MUST BE VERY LAST app.use)
app.use(errorHandler);

// ==========================================
// START SERVER (MUST BE AT THE VERY BOTTOM)
// ==========================================
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server listening on http://localhost:${PORT}`);
});