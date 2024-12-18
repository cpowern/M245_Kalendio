const mongoose = require('mongoose');

const CalendarSchema = new mongoose.Schema({
    groupName: { type: String, required: true },
    calendarId: { type: String, required: true },
    groupCode: { type: String, required: true, unique: true },
});

module.exports = mongoose.model('Calendar', CalendarSchema);