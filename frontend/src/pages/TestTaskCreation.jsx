import React, { useState } from 'react';
import axios from 'axios';

const TestTaskCreation = () => {
  const [calendarId, setCalendarId] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState('');
  const [responseMessage, setResponseMessage] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
        const response = await axios.post(
            'http://localhost:5000/tasks/create-task', // Ensure this matches your backend route
            { calendarId, title, description, date },
            { withCredentials: true }
        );
      setResponseMessage(response.data.success ? 'Task saved successfully!' : response.data.message);
    } catch (error) {
      setResponseMessage(`Error: ${error.response?.data?.message || error.message}`);
    }
  };

  return (
    <div style={{ padding: '20px', maxWidth: '600px', margin: '0 auto' }}>
      <h1>Test Task Creation</h1>
      <form onSubmit={handleSubmit}>
        <div>
          <label>Calendar ID:</label>
          <input
            type="text"
            value={calendarId}
            onChange={(e) => setCalendarId(e.target.value)}
            required
            style={{ width: '100%', marginBottom: '10px', padding: '5px' }}
          />
        </div>
        <div>
          <label>Title:</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            style={{ width: '100%', marginBottom: '10px', padding: '5px' }}
          />
        </div>
        <div>
          <label>Description:</label>
          <input
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            style={{ width: '100%', marginBottom: '10px', padding: '5px' }}
          />
        </div>
        <div>
          <label>Date:</label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            required
            style={{ width: '100%', marginBottom: '10px', padding: '5px' }}
          />
        </div>
        <button type="submit" style={{ padding: '10px 20px', backgroundColor: '#4CAF50', color: 'white', border: 'none' }}>
          Save Task
        </button>
      </form>
      {responseMessage && <p style={{ marginTop: '20px' }}>{responseMessage}</p>}
    </div>
  );
};

export default TestTaskCreation;
