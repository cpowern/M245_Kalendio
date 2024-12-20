const express = require('express');
const router = express.Router();
const Task = require('../models/Task');
const { google } = require('googleapis');

router.post('/create-task', async (req, res) => {
  const { calendarId, title, description, date, time } = req.body;

  if (!calendarId || !title || !date) {
    return res.status(400).json({ success: false, message: 'Missing required fields' });
  }

  try {
    console.log('Creating task:', { calendarId, title, description, date, time });

    const auth = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET
    );
    auth.setCredentials({ refresh_token: process.env.REFRESHTOKEN });

    const calendar = google.calendar({ version: 'v3', auth });

    // Wenn keine Zeit angegeben, nutze 12:00 als Standard
    const chosenTime = time && time.trim() !== '' ? time : '12:00';

    const [hours, minutes] = chosenTime.split(':');
    const startDate = new Date(date);
    startDate.setHours(hours, minutes || 0, 0, 0);
    const endDate = new Date(startDate.getTime() + 3600000); // +1 Stunde

    // Google Kalender Event
    const event = {
      summary: title,
      description,
      start: {
        dateTime: startDate.toISOString(),
        timeZone: 'Europe/Zurich', 
      },
      end: {
        dateTime: endDate.toISOString(),
        timeZone: 'Europe/Zurich',
      },
    };

    await calendar.events.insert({
      calendarId,
      requestBody: event,
    });

    console.log('Task added to Google Calendar:', event);

    // Speichere in MongoDB
    const task = await Task.create({
      calendarId,
      title,
      description,
      date: startDate, // enthält Datum und Zeit
      time: chosenTime, // hier explizit die Zeit speichern
    });

    console.log('Task created:', task);
    res.status(201).json({ success: true, task });
  } catch (error) {
    console.error('Error creating task:', error.message);
    res.status(500).json({ success: false, message: 'Error creating task' });
  }
});

// In routes/tasks.js
router.delete('/delete-task/:id', async (req, res) => {
  try {
    const taskId = req.params.id;
    const deletedTask = await Task.findByIdAndDelete(taskId);

    if (!deletedTask) {
      return res.status(404).json({ success: false, message: 'Task not found' });
    }

    // Delete corresponding Google Calendar event
    const auth = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET
    );
    auth.setCredentials({ refresh_token: process.env.REFRESHTOKEN });

    const calendar = google.calendar({ version: 'v3', auth });

    try {
      await calendar.events.delete({
        calendarId: deletedTask.calendarId,
        eventId: deletedTask._id.toString(),
      });
      console.log('Google Calendar event deleted');
    } catch (error) {
      console.error('Error deleting Google Calendar event:', error.message);
      // Handle cases where the event doesn't exist in Google Calendar
    }

    res.status(200).json({ success: true, message: 'Task deleted successfully' });
  } catch (error) {
    console.error('Error deleting task:', error.message);
    res.status(500).json({ success: false, message: 'Error deleting task' });
  }
});





router.get('/tasks', async (req, res) => {
  const { calendarId, date } = req.query;

  if (!calendarId || !date) {
    return res.status(400).json({ success: false, message: 'Missing required query parameters' });
  }

  try {
    const startOfDay = new Date(date);
    startOfDay.setUTCHours(0, 0, 0, 0);

    const endOfDay = new Date(date);
    endOfDay.setUTCHours(23, 59, 59, 999);

    console.log(`Fetching tasks for calendarId: ${calendarId}, Date range: ${startOfDay} - ${endOfDay}`);

    const tasks = await Task.find({
      calendarId,
      date: { $gte: startOfDay, $lte: endOfDay },
    });

    if (tasks.length === 0) {
      console.log('No tasks found for the specified date range.');
    } else {
      console.log('Tasks retrieved:', tasks);
    }

    res.status(200).json({ success: true, tasks });
  } catch (error) {
    console.error('Error fetching tasks:', error.message);
    res.status(500).json({ success: false, message: 'Error fetching tasks' });
  }
});

// Debugging route to fetch all tasks from the database for a specific calendarId
router.get('/debug-tasks/:calendarId', async (req, res) => {
  const { calendarId } = req.params;

  try {
      const tasks = await Task.find({ calendarId });
      res.status(200).json({ success: true, tasks });
  } catch (error) {
      console.error('Error fetching tasks for debugging:', error.message);
      res.status(500).json({ success: false, message: 'Error fetching tasks for debugging' });
  }
});

// Temporary in-memory storage
let mockTasks = [];

// Endpoint to save a task locally
router.post('/mock-save-task', (req, res) => {
  const { calendarId, title, description, date } = req.body;

  if (!calendarId || !title || !date) {
    return res.status(400).json({ success: false, message: 'Missing required fields' });
  }

  const newTask = { calendarId, title, description, date, id: mockTasks.length + 1 };
  mockTasks.push(newTask);

  console.log('Task saved locally:', newTask);
  res.status(201).json({ success: true, task: newTask });
});

// Endpoint to fetch locally saved tasks
router.get('/mock-fetch-tasks', (req, res) => {
  res.status(200).json({ success: true, tasks: mockTasks });
});

router.post('/test-db-save-task', async (req, res) => {
  const { calendarId, title, description, date } = req.body;

  try {
    if (!calendarId || !title || !date) {
      return res.status(400).json({ success: false, message: 'Missing required fields' });
    }

    const task = await Task.create({ calendarId, title, description, date });
    console.log('Task saved to DB:', task);
    res.status(201).json({ success: true, task });
  } catch (error) {
    console.error('Error saving task to DB:', error.message);
    res.status(500).json({ success: false, message: 'Error saving task to database' });
  }
});


module.exports = router;
