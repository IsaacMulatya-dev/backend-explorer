const express = require('express');
const app = express();
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const morgan = require('morgan');

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
const logger = require('./utils/logger');

// Connect Databases
connectMongo();

// ==========================================
// GLOBAL SECURITY & LOGGING MIDDLEWARE
// ==========================================

// 1. HTTP Request Logger
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined'));
}

// 2. Set Security HTTP Headers
app.use(helmet());

// 3. Global Rate Limiter (100 requests per 15 minutes)
const globalLimiter = rateLimit({
  max: 100,
  windowMs: 15 * 60 * 1000,
  message: 'Too many requests from this IP, please try again in 15 minutes!',
});
app.use('/api', globalLimiter);

// 4. Strict Rate Limiter for Authentication Endpoints (5 attempts per hour)
const authLimiter = rateLimit({
  max: 5,
  windowMs: 60 * 60 * 1000,
  message: 'Too many failed login/registration attempts, please try again in an hour!',
});
app.use('/api/auth/login', authLimiter);

// 5. Body Parser with 10kb limit (prevents payload flood)
app.use(express.json({ limit: '10kb' }));

// 6. Safe NoSQL Injection Sanitization (skips read-only req.query)
app.use((req, res, next) => {
  if (req.body) mongoSanitize.sanitize(req.body);
  if (req.params) mongoSanitize.sanitize(req.params);
  next();
});

// ==========================================
// MONGODB USER CRUD ROUTES
// ==========================================

app.post('/api/mongo/users', catchAsync(async (req, res, next) => {
  const user = await UserMongo.create(req.body);
  res.status(201).json({ success: true, data: user });
}));

app.get('/api/mongo/users', catchAsync(async (req, res, next) => {
  const users = await UserMongo.find().sort({ createdAt: -1 });
  res.json({ success: true, count: users.length, data: users });
}));

app.get('/api/mongo/users/:id', catchAsync(async (req, res, next) => {
  const user = await UserMongo.findById(req.params.id);
  if (!user) {
    return next(new AppError('User not found', 404));
  }
  res.json({ success: true, data: user });
}));

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

app.post('/api/auth/register', catchAsync(async (req, res, next) => {
  const { name, email, password } = req.body;
  const newUser = await UserMongo.create({ name, email, password });
  newUser.password = undefined;
  const token = generateToken(newUser._id);

  res.status(201).json({
    success: true,
    token,
    data: { user: newUser }
  });
}));

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

app.get('/api/auth/me', protect, catchAsync(async (req, res, next) => {
  res.json({
    success: true,
    data: { user: req.user }
  });
}));

// ==========================================
// ADVANCED POST & POPULATION ROUTES
// ==========================================

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

app.get('/api/analytics/post-stats', catchAsync(async (req, res, next) => {
  const stats = await PostMongo.aggregate([
    { $match: { content: { $exists: true, $ne: '' } } },
    {
      $group: {
        _id: { $toUpper: '$category' },
        numPosts: { $sum: 1 },
        avgTitleLength: { $avg: { $strLenCP: '$title' } },
      }
    },
    { $sort: { numPosts: -1 } },
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
    { $unwind: '$authorDetails' },
    {
      $project: {
        _id: 0,
        authorId: '$_id',
        name: '$authorDetails.name',
        email: '$authorDetails.email',
        totalPosts: 1
      }
    },
    { $sort: { totalPosts: -1 } }
  ]);

  res.json({
    success: true,
    results: authorStats.length,
    data: { authorStats }
  });
}));

// ==========================================
// UNHANDLED ROUTES & GLOBAL ERROR HANDLER
// ==========================================

app.use((req, res, next) => {
  next(new AppError(`Cannot find ${req.originalUrl} on this server!`, 404));
});

app.use(errorHandler);

// ==========================================
// START SERVER & GRACEFUL SHUTDOWN
// ==========================================
const PORT = process.env.PORT || 5000;

const server = app.listen(PORT, () => {
  logger.info(`Server listening on http://localhost:${PORT}`);
});

const shutdown = (signal) => {
  logger.warn(`${signal} received. Closing HTTP server cleanly...`);
  server.close(() => {
    logger.info('HTTP server closed.');
    process.exit(0);
  });
};

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));