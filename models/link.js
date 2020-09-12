const mongoose = require('mongoose');
const { ObjectId } = mongoose.Schema;

const linkSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      trim: true,
      required: true,
      max: 256
    },
    url: {
      type: String,
      trim: true,
      required: true,
      max: 1028
    },
    slug: {
      type: String,
      lowercase: true,
      unique: true,
      required: true,
      max: 155,
      index: true
    },
    postedBy: { type: ObjectId, ref: 'User' },
    categories: [{ type: ObjectId, ref: 'Category', required: true }],

    type: {
      type: String,
      default: 'free'
    },
    medium: {
      type: String,
      default: 'video'
    },
    level: {
      type: String,
      default: 'beginner'
    },
    clicks: {
      type: Number,
      default: 0
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Link', linkSchema);
