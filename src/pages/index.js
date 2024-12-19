import React, { useState, useEffect } from 'react';
import Calendar from 'react-calendar';
import { format, parse, isEqual } from 'date-fns';
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, addDoc, getDocs, deleteDoc, doc, updateDoc } from 'firebase/firestore';
import { PlusCircle, Trash2, Edit2, Save, X } from 'lucide-react';

// Initialize Firebase - Replace with your config
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENTID
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const getRandomColor = () => {
  const colors = [
    'bg-blue-500', 'bg-green-500', 'bg-red-500', 'bg-yellow-500',
    'bg-purple-500', 'bg-pink-500', 'bg-indigo-500', 'bg-teal-500'
  ];
  return colors[Math.floor(Math.random() * colors.length)];
};

const Home = () => {
  const [events, setEvents] = useState([]);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedTasks, setSelectedTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isAddingTask, setIsAddingTask] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [newTask, setNewTask] = useState({ subject: '', task: '', duration:'' });

  // Parse date string
  const parseDateString = (dateStr) => {
    // Match dd/mm/yy format
    const match = dateStr.match(/^(\d{2})\/(\d{2})\/(\d{2})$/);
    if (!match) return null;
  
    const day = match[1];
    const month = match[2] - 1;  // Months are 0-indexed in JavaScript Date
    const year = `20${match[3]}`; // Assuming the year is in 20xx format
  
    try {
      return new Date(year, month, day);  // Returns a Date object
    } catch (e) {
      console.error('Error parsing date:', e);
      return null;
    }
  };
  

  // Fetch events from Firestore
  const fetchEvents = async () => {
    setLoading(true);
    try {
      const querySnapshot = await getDocs(collection(db, 'events'));
      const eventsData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setEvents(eventsData);
      setError(null);
    } catch (err) {
      setError('Failed to fetch events: ' + err.message);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  // Add new task
  const handleAddTask = async () => {
    const dateStr = selectedDate.getDate().toString().padStart(2, '0') + '/' + 
     (selectedDate.getMonth() + 1).toString().padStart(2, '0')+ '/' + 
    (selectedDate.getFullYear() % 100).toString().padStart(2, '0');;
     const eventForDate = events.find(event => event.date === dateStr);
    try {
    
      if (eventForDate) {
        // Add task to existing date
        const updatedTasks = [...eventForDate.tasks, { ...newTask, color: getRandomColor() }];
        await updateDoc(doc(db, 'events', eventForDate.id), {
          tasks: updatedTasks
        });
      } else {
        // Create new date entry
        await addDoc(collection(db, 'events'), {
          date: dateStr,
          tasks: [{ ...newTask, color: getRandomColor() }]
        });
      }
      
      setNewTask({subject:'', duration:'', task:''   });
      setIsAddingTask(false);
      fetchEvents();
     } catch (err) {
      setError('Failed to add task: ' + err.message);
    }
  };

  // Delete task
  const handleDeleteTask = async (eventId, taskIndex) => {
    try {
      const event = events.find(e => e.id === eventId);
      const updatedTasks = event.tasks.filter((_, index) => index !== taskIndex);
      
      if (updatedTasks.length === 0) {
        await deleteDoc(doc(db, 'events', eventId));
      } else {
        await updateDoc(doc(db, 'events', eventId), {
          tasks: updatedTasks
        });
      }
      
      fetchEvents();
    } catch (err) {
      setError('Failed to delete task: ' + err.message);
    }
  };

  // Update task
  const handleUpdateTask = async (eventId, taskIndex) => {
    try {
      const event = events.find(e => e.id === eventId);
      const updatedTasks = [...event.tasks];
      updatedTasks[taskIndex] = { ...editingTask, color: event.tasks[taskIndex].color };
      
      await updateDoc(doc(db, 'events', eventId), {
        tasks: updatedTasks
      });
      
      setEditingTask(null);
      fetchEvents();
    } catch (err) {
      setError('Failed to update task: ' + err.message);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <main className="max-w-6xl mx-auto">
      {/* <button
  onClick={() =>{ console.log("seed");fetch('./api/seed', { method: 'POST' })}}
  className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
>
  Seed Database
</button> */}
        <h1 className="text-4xl font-bold mb-8 text-center">Study Plan Calendar</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Calendar */}
          <div className="bg-white p-4 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">Calendar View</h2>
            <Calendar 
              onChange={setSelectedDate} 
              value={selectedDate}
              className="w-full rounded-lg"
            />
          </div>

          {/* Tasks */}
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">
                Schedule for {format(selectedDate, "do MMM")}
              </h2>
              <button
                onClick={() => setIsAddingTask(true)}
                className="flex items-center gap-2 bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600"
              >
                <PlusCircle className="w-4 h-4" />
                Add Task
              </button>
            </div>

            {/* Add Task Form */}
            {isAddingTask && (
              <div className="mb-4 p-4 border rounded-lg">
                <div className="space-y-4">
                  <input
                    type="text"
                    placeholder="Subject"
                    value={newTask.subject}
                    onChange={(e) => setNewTask(prev => ({ ...prev, subject: e.target.value }))}
                    className="w-full p-2 border rounded"
                  />
                  <input
                    type="text"
                    placeholder="Task"
                    value={newTask.task}
                    onChange={(e) => setNewTask(prev => ({ ...prev, task: e.target.value }))}
                    className="w-full p-2 border rounded"
                  />
                  <input
                    type="text"
                    placeholder="Duration"
                    value={newTask.duration}
                    onChange={(e) => setNewTask(prev => ({ ...prev, duration: e.target.value }))}
                    className="w-full p-2 border rounded"
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={handleAddTask}
                      className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
                    >
                      Add
                    </button>
                    <button
                      onClick={() => setIsAddingTask(false)}
                      className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Tasks List */}
            <div className="space-y-4">
              {loading ? (
                <p className="text-center text-gray-500">Loading schedule...</p>
              ) : events.find(event => 
                isEqual(parseDateString(event.date), selectedDate)
              )?.tasks.map((task, index) => (
                <div key={index} className="border rounded-lg p-4">
                  {editingTask && editingTask.index === index ? (
                    <div className="space-y-2">
                      <input
                        type="text"
                        value={editingTask.subject}
                        onChange={(e) => setEditingTask(prev => ({ ...prev, subject: e.target.value }))}
                        className="w-full p-2 border rounded"
                      />
                      <input
                        type="text"
                        value={editingTask.task}
                        onChange={(e) => setEditingTask(prev => ({ ...prev, task: e.target.value }))}
                        className="w-full p-2 border rounded"
                      />
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleUpdateTask(events.find(event => 
                            isEqual(parseDateString(event.date), selectedDate)
                          ).id, index)}
                          className="flex items-center gap-1 bg-green-500 text-white px-3 py-1 rounded hover:bg-green-600"
                        >
                          <Save className="w-4 h-4" />
                          Save
                        </button>
                        <button
                          onClick={() => setEditingTask(null)}
                          className="flex items-center gap-1 bg-gray-500 text-white px-3 py-1 rounded hover:bg-gray-600"
                        >
                          <X className="w-4 h-4" />
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex justify-between items-start">
                      <div>
                        <span className={`inline-block px-3 py-1 rounded-full text-white text-sm ${task.color || 'bg-blue-500'} mb-2`}>
                          {task.subject}
                        </span>
                        <p className="text-lg">{task.task}</p>
                     
                        <p className="text-lg">{task.duration}</p>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => setEditingTask({ ...task, index })}
                          className="text-blue-500 hover:text-blue-600"
                        >
                          <Edit2 className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => handleDeleteTask(events.find(event => 
                            isEqual(parseDateString(event.date), selectedDate)
                          ).id, index)}
                          className="text-red-500 hover:text-red-600"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )) || (
                <div className="text-center text-gray-500">
                  <p>No events scheduled for this day</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Home;