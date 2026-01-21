import { useEffect, useState } from 'react';
import './App.css';

interface Task {
  id: number;
  title: string;
  status: string;
  created_at: string;
}

function App() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/tasks')
      .then((res) => res.json())
      .then((data) => {
        setTasks(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Error fetching tasks:', err);
        setLoading(false);
      });
  }, []);

  return (
    <div className="container">
      <h1>Distributed Task Dashboard</h1>
      <div className="card">
        <h2>System Status</h2>
        {loading ? (
          <p>Loading system status...</p>
        ) : (
          <div className="task-list">
            {tasks.map((task) => (
              <div key={task.id} className={`task-item ${task.status}`}>
                <span className="task-id">#{task.id}</span>
                <span className="task-title">{task.title}</span>
                <span className="task-status">{task.status.toUpperCase()}</span>
              </div>
            ))}
          </div>
        )}
      </div>
      <p className="read-the-docs">
        Backend API: <code className="code">/api/tasks</code>
      </p>
    </div>
  );
}

export default App;
