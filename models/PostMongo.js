const mongoose = require('mongoose');

const postSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'A post must have a title'],
      trim: true,
      maxlength: [100, 'Title cannot exceed 100 characters'],
    },
    content: {
      type: String,
      required: [true, 'A post must have content'],
    },
    category: {
      type: String,
      default: 'General',
    },
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'UserMongo',
      required: [true, 'A post must belong to an author'],
    },
  },
  { timestamps: true }
);

//Compound Indexing: Optimize queries filtering by category and sorting by creation date
postSchema.index({ category: 1, createdAt: -1 });

module.exports = mongoose.model('PostMongo', postSchema);