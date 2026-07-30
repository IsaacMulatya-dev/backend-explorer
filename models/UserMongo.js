const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,   // Automatically creates a unique single-field index
    lowercase: true,
    index: true     // Explicit single-field index
  },
  skills: [String],
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Compound Index: Optimizes queries filtering by name and sorting by creation date
userSchema.index({ name: 1, createdAt: -1 });

module.exports = mongoose.model('UserMongo', userSchema);