import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import axios from 'axios';

const ShowTask = () => {
  const location = useLocation();
  const { calendarId, selectedDate } = location.state || {};
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTasks = async () => {
      try {
        const response = await axios.get(`http://localhost:5000/tasks/tasks`, {
          params: { calendarId, date: selectedDate },
          withCredentials: true,
        });
  
        console.log('Fetched tasks:', response.data.tasks); // Debug log
  
        if (response.data.success) {
          setTasks(response.data.tasks);
        } else {
          console.error('Error fetching tasks:', response.data.message);
        }
      } catch (error) {
        console.error('Error fetching tasks:', error);
      } finally {
        setLoading(false);
      }
    };
  
    if (calendarId && selectedDate) {
      console.log('Fetching tasks for:', { calendarId, selectedDate }); // Debug log
      fetchTasks();
    }
  }, [calendarId, selectedDate]);  

  if (!calendarId || !selectedDate) {
    return <div>Error: Missing calendarId or date!</div>;
  }

  return (
    <div>
      <h1>Tasks for {new Date(selectedDate).toLocaleDateString()}</h1>
      {loading ? (
        <p>Loading...</p>
      ) : tasks.length > 0 ? (
        <ul>
          {tasks.map((task) => (
            <li key={task._id}>
              <strong>{task.title}</strong>: {task.description || 'No description'}
            </li>
          ))}
        </ul>
      ) : (
        <p>No tasks found for this date.</p>
      )}
    </div>
  );
};

export default ShowTask;
