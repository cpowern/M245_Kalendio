// routes/tasks.js
const express = require('express');
const router = express.Router();
const Task = require('../models/Task');
const Calendar = require('../models/Calendar'); // importiert, um Owner zu checken
const { google } = require('googleapis');
const { ensureAuthenticated } = require('../routes/auth'); 


// -----------------------------------------------------
// CREATE TASK:
router.post('/create-task', ensureAuthenticated, async (req, res) => {
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

    // Wenn keine Zeit angegeben => Standard 12:00
    const chosenTime = time && time.trim() !== '' ? time : '12:00';
    const [hours, minutes] = chosenTime.split(':');
    const startDate = new Date(date);
    startDate.setHours(hours, minutes || 0, 0, 0);
    const endDate = new Date(startDate.getTime() + 3600000); // +1 Stunde

    // Google Calendar Event
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

    // Füge Event in Google Calendar ein
    const insertedEvent = await calendar.events.insert({
      calendarId,
      requestBody: event,
    });

    console.log('Task added to Google Calendar:', insertedEvent.data);

    // Google-Event-ID holen
    const googleEventId = insertedEvent.data.id;

    // In MongoDB speichern
    const creatorId = req.user ? req.user._id : null;
    const task = await Task.create({
      calendarId,
      title,
      description,
      date: startDate,
      time: chosenTime,
      createdBy: creatorId,
      googleEventId,
    });

    console.log('Task created:', task);
    res.status(201).json({ success: true, task });
  } catch (error) {
    console.error('Error creating task:', error.message);
    res.status(500).json({ success: false, message: 'Error creating task' });
  }
});

// -----------------------------------------------------
// DELETE TASK -> nur Admin darf löschen
router.delete('/delete-task/:id', ensureAuthenticated, async (req, res) => {
  console.log('[DELETE /delete-task/:id] ENTERED =>', req.params.id);

  try {
    const taskId = req.params.id;

    // 1) Task holen
    const foundTask = await Task.findById(taskId);
    console.log('[DEBUG] foundTask =>', foundTask);

    if (!foundTask) {
      console.log('[DEBUG] => 404 (Task not found)');
      return res.status(404).json({ success: false, message: 'Task not found' });
    }

    // 2) Kalender holen, um Owner zu checken
    const calDoc = await Calendar.findOne({ calendarId: foundTask.calendarId });
    console.log('[DEBUG] calDoc =>', calDoc);

    if (!calDoc) {
      console.log('[DEBUG] => 404 (Associated calendar not found)');
      return res.status(404).json({
        success: false,
        message: 'Associated calendar not found',
      });
    }

    // 3) Prüfen, ob der currentUser = Owner
    console.log('[DEBUG] calDoc.owner.toString() =>', calDoc.owner.toString());
    console.log('[DEBUG] req.user._id.toString() =>', req.user._id.toString());

    if (calDoc.owner.toString() !== req.user._id.toString()) {
      console.log('[DEBUG] => 403 (not same owner)');
      return res.status(403).json({
        success: false,
        message: 'Only the admin (calendar owner) can delete tasks',
      });
    }

    // 4) Task wirklich löschen
    const deletedTask = await Task.findByIdAndDelete(taskId);
    console.log('[DEBUG] deletedTask =>', deletedTask);

    // Aus Google Calendar löschen
    const auth = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET
    );
    auth.setCredentials({ refresh_token: process.env.REFRESHTOKEN });

    const calendar = google.calendar({ version: 'v3', auth });
    try {
      console.log('[DEBUG] => Deleting event from Google...');
      await calendar.events.delete({
        calendarId: deletedTask.calendarId,
        eventId: deletedTask.googleEventId,
      });
      console.log('[DEBUG] => Google Calendar event deleted');
    } catch (error) {
      console.error('Error deleting Google Calendar event:', error.message);
      // Falls das Event nicht (mehr) existiert, ist das kein Drama
    }

    console.log('[DEBUG] => returning 200');
    res.status(200).json({ success: true, message: 'Task deleted successfully' });

  } catch (error) {
    console.error('[DELETE /delete-task/:id] => Error:', error);
    res.status(500).json({ success: false, message: 'Error deleting task' });
  }
});

// -----------------------------------------------------
// GET /tasks
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

// -----------------------------------------------------
// DEBUG: fetch all tasks for a calendar
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

// -----------------------------------------------------
// Temporary in-memory storage
let mockTasks = [];

// Save a task locally
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

// Fetch locally saved tasks
router.get('/mock-fetch-tasks', (req, res) => {
  res.status(200).json({ success: true, tasks: mockTasks });
});

// test-db-save-task
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

// -----------------------------------------------------
// ACCEPT/REJECT (unverändert)
router.post('/accept-task/:id', async (req, res) => {
  try {
    const userId = req.user ? req.user._id : null;
    if (!userId) {
      return res.status(401).json({ success: false, message: 'Not authenticated' });
    }

    const task = await Task.findById(req.params.id);
    if (!task) {
      return res.status(404).json({ success: false, message: 'Task not found' });
    }
    if (task.createdBy && task.createdBy.toString() === userId.toString()) {
      return res.status(400).json({ success: false, message: 'Creator cannot accept own task' });
    }
    if (task.status !== 'pending') {
      return res.status(400).json({ success: false, message: 'Task is not in pending status' });
    }
    if (task.acceptedBy.includes(userId) || task.rejectedBy.includes(userId)) {
      return res.status(400).json({ success: false, message: 'User already voted' });
    }
    
    // Akzeptiere den Task
    task.acceptedBy.push(userId);
    
    // Dynamischer Schwellenwert basierend auf der Mitgliederzahl im Calendar-Dokument:
    // Standardwert, falls das Calendar-Dokument nicht gefunden wird, ist 3
    let acceptanceThreshold = 3;
    const calendarDoc = await require('../models/Calendar').findOne({ calendarId: task.calendarId });
    if (calendarDoc && calendarDoc.membersCount) {
      const count = calendarDoc.membersCount;
      if (count >= 2 && count <= 4) {
        acceptanceThreshold = 1;
      } else if (count >= 5 && count <= 9) {
        acceptanceThreshold = 2;
      } else if (count >= 10 && count < 20) {
        acceptanceThreshold = 3;
      } else if (count >= 20) {
        acceptanceThreshold = 4;
      }
    }
    
    if (task.acceptedBy.length >= acceptanceThreshold) {
      task.status = 'accepted';
    }
    
    await task.save();
    
    return res.status(200).json({
      success: true,
      message: 'Task accepted',
      status: task.status,
      acceptedCount: task.acceptedBy.length,
      rejectedCount: task.rejectedBy.length,
    });
  } catch (error) {
    console.error('Error accepting task:', error);
    res.status(500).json({ success: false, message: 'Error accepting task' });
  }
});


router.post('/reject-task/:id', async (req, res) => {
  try {
    const userId = req.user ? req.user._id : null;
    if (!userId) {
      return res.status(401).json({ success: false, message: 'Not authenticated' });
    }

    const task = await Task.findById(req.params.id);
    if (!task) {
      return res.status(404).json({ success: false, message: 'Task not found' });
    }
    if (task.createdBy && task.createdBy.toString() === userId.toString()) {
      return res.status(400).json({ success: false, message: 'Creator cannot reject own task' });
    }
    if (task.status !== 'pending') {
      return res.status(400).json({ success: false, message: 'Task is not in pending status' });
    }
    if (task.acceptedBy.includes(userId) || task.rejectedBy.includes(userId)) {
      return res.status(400).json({ success: false, message: 'User already voted' });
    }

    // Reject
    task.rejectedBy.push(userId);

    if (task.rejectedBy.length >= 3) {
      // Task komplett löschen (inkl. Google)
      const auth = new google.auth.OAuth2(
        process.env.GOOGLE_CLIENT_ID,
        process.env.GOOGLE_CLIENT_SECRET
      );
      auth.setCredentials({ refresh_token: process.env.REFRESHTOKEN });
      const calendar = google.calendar({ version: 'v3', auth });

      try {
        await calendar.events.delete({
          calendarId: task.calendarId,
          eventId: task.googleEventId,
        });
        console.log('Google Calendar event deleted (due to rejections)');
      } catch (error) {
        console.error('Error deleting Google Calendar event:', error.message);
      }

      await Task.findByIdAndDelete(task._id);
      return res.status(200).json({ success: true, message: 'Task rejected and deleted' });
    }

    await task.save();

    return res.status(200).json({
      success: true,
      message: 'Task rejected',
      status: task.status,
      acceptedCount: task.acceptedBy.length,
      rejectedCount: task.rejectedBy.length,
    });
  } catch (error) {
    console.error('Error rejecting task:', error);
    res.status(500).json({ success: false, message: 'Error rejecting task' });
  }
});

// Exportieren, damit sie in anderen Dateien verwendet werden kann
module.exports = { ensureAuthenticated };


module.exports = router;
