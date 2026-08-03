const express = require('express');
const app = express();

// Core Middleware
app.use(express.json());

// Connection & Model Imports
const pool = require('./db');
const connectMongo = require('./dbMongo');
const UserMongo = require('./models/UserMongo');
const PostMongo = require('./models/PostMongo');

// Error Handling & Utility Imports
const AppError = require('./utils/AppError');
const catchAsync = require('./utils/catchAsync');
const errorHandler = require('./middleware/errorHandler');
const generateToken = require('./utils/generateToken');
const { protect } = require('./middleware/authMiddleware');

// Connect Databases
connectMongo();

// ==========================================
// MONGODB USER CRUD ROUTES
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
// AUTHENTICATION ROUTES
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

// 3. PROTECTED PROFILE ROUTE
app.get('/api/auth/me', protect, catchAsync(async (req, res, next) => {
  res.json({
    success: true,
    data: { user: req.user }
  });
}));

// ==========================================
// ADVANCED POST & POPULATION ROUTES
// ==========================================

// 1. CREATE POST (Authenticated)
app.post('/api/posts', protect, catchAsync(async (req, res, next) => {
  const newPost = await PostMongo.create({
    title: req.body.title,
    content: req.body.content,
    category: req.body.category,
    author: req.user._id,
  });

  res.status(201).json({
    success: true,
    data: { post: newPost },
  });
}));

// 2. READ ALL POSTS (With Population, Filtering & Pagination)
app.get('/api/posts', catchAsync(async (req, res, next) => {
  const queryObj = { ...req.query };
  const excludedFields = ['page', 'sort', 'limit', 'fields'];
  excludedFields.forEach((el) => delete queryObj[el]);

  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 10;
  const skip = (page - 1) * limit;

  const posts = await PostMongo.find(queryObj)
    .populate('author', 'name email role')
    .sort('-createdAt')
    .skip(skip)
    .limit(limit);

  const totalPosts = await PostMongo.countDocuments(queryObj);

  res.json({
    success: true,
    results: posts.length,
    pagination: {
      page,
      limit,
      totalPages: Math.ceil(totalPosts / limit),
      totalPosts,
    },
    data: { posts },
  });
}));

// 3. READ SINGLE POST (With Author Population)
app.get('/api/posts/:id', catchAsync(async (req, res, next) => {
  const post = await PostMongo.findById(req.params.id).populate('author', 'name email');

  if (!post) {
    return next(new AppError('No post found with that ID', 404));
  }

  res.json({
    success: true,
    data: { post },
  });
}));

// ==========================================
// DATA AGGREGATION & ANALYTICS ROUTES
// ==========================================

// 1. ANALYTICS: Calculate Post Stats by Category
app.get('/api/analytics/post-stats', catchAsync(async (req, res, next) => {
  const stats = await PostMongo.aggregate([
    {
      $match: { content: { $exists: true, $ne: '' } }
    },
    {
      $group: {
        _id: { $toUpper: '$category' },
        numPosts: { $sum: 1 },
        avgTitleLength: { $avg: { $strLenCP: '$title' } },
      }
    },
    {
      $sort: { numPosts: -1 }
    },
    {
      $project: {
        _id: 0,
        category: '$_id',
        numPosts: 1,
        avgTitleLength: { $round: ['$avgTitleLength', 1] }
      }
    }
  ]);

  res.json({
    success: true,
    results: stats.length,
    data: { stats }
  });
}));

// 2. ANALYTICS: Author Activity Stats ($lookup join)
app.get('/api/analytics/author-stats', catchAsync(async (req, res, next) => {
  const authorStats = await PostMongo.aggregate([
    {
      $group: {
        _id: '$author',
        totalPosts: { $sum: 1 }
      }
    },
    {
      $lookup: {
        from: 'usermongos',
        localField: '_id',
        foreignField: '_id',
        as: 'authorDetails'
      }
    },
    {
      $unwind: '$authorDetails'
    },
    {
      $project: {
        _id: 0,
        authorId: '$_id',
        name: '$authorDetails.name',
        email: '$authorDetails.email',
        totalPosts: 1
      }
    },
    {
      $sort: { totalPosts: -1 }
    }
  ]);

  res.json({
    success: true,
    results: authorStats.length,
    data: { authorStats }
  });
}));

// Demo custom operational error test route
app.get('/api/mongo/users/test-error/:id', catchAsync(async (req, res, next) => {
  if (req.params.id === 'invalid') {
    return next(new AppError('This is a custom operational error test!', 400));
  }
  res.json({ success: true, message: 'Valid ID passed!' });
}));

// ==========================================
// UNHANDLED ROUTES & GLOBAL ERROR HANDLER
// ==========================================

// Catch-all for undefined routes
app.use((req, res, next) => {
  next(new AppError(`Cannot find ${req.originalUrl} on this server!`, 404));
});

// Global Error Handling Middleware
app.use(errorHandler);

// ==========================================
// START SERVER
// ==========================================
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server listening on http://localhost:${PORT}`);
});