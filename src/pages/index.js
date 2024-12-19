// pages/index.js
import { useState, useEffect } from "react";
import Calendar from "react-calendar";
import { format } from "date-fns";
import Head from "next/head";

export default function Home() {
  const [tasks, setTasks] = useState([]);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [tasksForSelectedDate, setTasksForSelectedDate] = useState([]);

  // Fetch tasks from the JSON file
  useEffect(() => {
    fetch("/studyPlan.json")
      .then((response) => response.json())
      .then((data) => setTasks(data));
  }, []);

  // Filter tasks for the selected date
  useEffect(() => {
    const selectedDateString = format(selectedDate, "yyyy-MM-dd");
    const filteredTasks = tasks.filter((task) => task.date === selectedDateString);
    setTasksForSelectedDate(filteredTasks);
  }, [selectedDate, tasks]);

  return (
    <div>
      <Head>
        <title>Study Planner</title>
        <meta name="description" content="Study planner for exams" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <h1>Study Planner</h1>

      <div style={{ display: "flex", gap: "20px" }}>
        <div>
          <Calendar onChange={setSelectedDate} value={selectedDate} />
        </div>

        <div>
          <h2>Tasks for {format(selectedDate, "MMMM dd, yyyy")}</h2>
          <ul>
            {tasksForSelectedDate.length > 0 ? (
              tasksForSelectedDate.map((task, index) => (
                <li key={index}>
                  <strong>{task.subject}</strong>: {task.task} ({task.duration})
                </li>
              ))
            ) : (
              <p>No tasks for this day</p>
            )}
          </ul>
        </div>
      </div>
    </div>
  );
}
