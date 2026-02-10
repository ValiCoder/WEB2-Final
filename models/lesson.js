const mongoose = require('mongoose');

const lessonSchema = new mongoose.Schema({
  title: { 
    type: String, 
    required: true 
  },
  content: { 
    type: String, 
    required: true 
  },
  type: { 
    type: String, 
    enum: ['text', 'video', 'document', 'quiz'], 
    default: 'text' 
  },
  order: { 
    type: Number, 
    required: true 
  },
  course: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Course', 
    required: true 
  },
  owner: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  videoUrl: String,
  attachments: [String],
  duration: Number,
  isPublished: { 
    type: Boolean, 
    default: false 
  }
}, { 
  timestamps: true 
});

const Lesson = mongoose.model('Lesson', lessonSchema);
module.exports = Lesson;