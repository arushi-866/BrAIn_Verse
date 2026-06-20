const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  fullName: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true
  },
  password: {
    type: String,
    required: true
  },
  title: {
    type: String,
    default: 'AI Study Enthusiast'
  },
  stats: {
    summaries: {
      type: Number,
      default: 0
    },
    mindMaps: {
      type: Number,
      default: 0
    },
    flashcards: {
      type: Number,
      default: 0
    },
    quizzes: {
      type: Number,
      default: 0
    }
  },
  summaries: [{
    id: Number,
    title: String,
    date: String,
    likes: Number,
    comments: Number
  }],
  mindMaps: [{
    id: Number,
    title: String,
    date: String,
    nodes: Number
  }],
  quizzes: [{
    id: Number,
    title: String,
    date: String,
    score: Number,
    totalQuestions: Number
  }],
  flashcards: [
    {
      id: String,
      title: String,
      content: String,
      date: String,
      likes: { type: Number, default: 0 },
      comments: { type: Number, default: 0 }
    }
  ]
}, { timestamps: true });


module.exports = mongoose.model('User', UserSchema);
