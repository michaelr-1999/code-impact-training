import { useState } from "react";
import { Task } from "./types";
import TaskCard from "./TaskCard";

const initialTasks: Task[] = [
  { id: "1", title: "Set up the project", completed: true },
  { id: "2", title: "Build the TaskCard component", completed: true },
  { id: "3", title: "Connect to the backend", completed: false },
];

function App() {
  const [tasks] = useState<Task[]>(initialTasks);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">Impact Training</h1>
        <div className="mt-6 flex flex-col gap-3 text-left">
          {tasks.map((task) => (
            <TaskCard key={task.id} task={task} />
          ))}
        </div>
      </div>
    </div>
  );
}

export default App;
