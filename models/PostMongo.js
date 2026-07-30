const mongoose = require('mongoose');

const postSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  content: {
    type: String,
    required: true
  },
  // Reference to UserMongo collection
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'UserMongo',
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('PostMongo', postSchema);