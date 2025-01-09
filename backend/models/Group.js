//group.js
const mongoose = require('mongoose');

const GroupSchema = new mongoose.Schema({
  groupName: {
    type: String,
    required: true,
  },
  groupCode: {
    type: String,
    required: true,
    unique: true,
  },
  calendarId: {
    type: String,
    required: true,
  },
  membersCount: {
    type: Number,
    default: 1,
  },
  ranked: {
    type: Boolean,
    default: false,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Der Gruppencode sollte einzigartig sein. Diesen kannst du generieren, wenn eine neue Gruppe erstellt wird.
// Zum Beispiel ein alphanumerischer String, um jede Gruppe eindeutig identifizierbar zu machen.
GroupSchema.pre('save', function (next) {
  if (!this.groupCode) {
    // Beispiel: Generiere einen einfachen alphanumerischen Code
    this.groupCode = Math.random().toString(36).substr(2, 8).toUpperCase();
  }
  next();
});

module.exports = mongoose.model('Group', GroupSchema);
