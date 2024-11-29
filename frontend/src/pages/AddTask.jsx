import React, { useState } from 'react';
 
const AddTask = () => {
    const [title, setTitle] = useState('');
    const [date, setDate] = useState('');
    const [taskType, setTaskType] = useState('');
    const [description, setDescription] = useState('');

    const handleSave = () => {
        if (!title || !date || !taskType) {
            alert('Please fill out all required fields (Title, Date, and Task Type).');
            return;
        }

        const taskData = { title, date, taskType, description };
        console.log('Task saved:', taskData);
        alert('Task saved successfully!');

        setTitle('');
        setDate('');
        setTaskType('');
        setDescription('');
    };

    return (
        <div style={{ padding: '2rem', maxWidth: '600px', margin: '0 auto', fontFamily: 'Arial, sans-serif' }}>
            <h2 style={{ textAlign: 'center', marginBottom: '1.5rem' }}>Add Task</h2>

            <label>Title</label>
            <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Enter task title"
                style={{ width: '100%', padding: '0.5rem', marginBottom: '1rem', border: '1px solid #ccc', borderRadius: '4px' }}
            />

            <label>Date</label>
            <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                style={{ width: '100%', padding: '0.5rem', marginBottom: '1rem', border: '1px solid #ccc', borderRadius: '4px' }}
            />

            <label>Task Type</label>
            <div style={{ marginBottom: '1rem' }}>
                <label>
                    <input type="radio" value="Prüfung" checked={taskType === 'Prüfung'} onChange={() => setTaskType('Prüfung')} />
                    Prüfung
                </label>
                <label>
                    <input type="radio" value="Aufgabe" checked={taskType === 'Aufgabe'} onChange={() => setTaskType('Aufgabe')} />
                    Aufgabe
                </label>
            </div>

            <label>Description</label>
            <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Add description (optional)"
                style={{ width: '100%', height: '100px', border: '1px solid #ccc', borderRadius: '4px', marginBottom: '1.5rem' }}
            />

            <button onClick={handleSave}>Save</button>
        </div>
    );
};

export default AddTask;