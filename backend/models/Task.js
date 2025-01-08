// Task.js
const mongoose = require('mongoose');

const TaskSchema = new mongoose.Schema({
  calendarId: {
    type: String,
    required: true,
  },
  title: {
    type: String,
    required: true,
  },
  description: {
    type: String,
  },
  date: {
    type: Date,
    required: true,
  },
  time: {
    type: String, // neu hinzugefügt, optional
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },

  // NEU HINZUGEFÜGT:
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  status: {
    type: String,
    default: 'pending', // 'pending', 'accepted', 'rejected'
  },
  acceptedBy: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  ],
  rejectedBy: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  ],

  // NEU HINZUGEFÜGT (wichtig für das Löschen mit Google-ID):
  googleEventId: {
    type: String,
  },
});

module.exports = mongoose.model('Task', TaskSchema);
