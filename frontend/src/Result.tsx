import { useState } from "react";
import { Button } from "./components/ui/button";
import type { Task } from "./type";

function Result() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [newTask, setNewTask] = useState("");

  const addTask = () => {
    if (newTask.trim() === "") return;
    const newTaskObject: Task = {
      id: Date.now().toString(),
      name: newTask, // 必須
      text: newTask,
      isCompleted: false,
      priority: "未設定",
      assignee: "未設定",
      description: "",
      deadline: "",
      assign: "",
      status: "",
    };

    setTasks([...tasks, newTaskObject]);
    setNewTask("");
  };

  const toggleTaskCompletion = (id: string) => {
    setTasks(
      tasks.map((task) =>
        task.id === id ? { ...task, isCompleted: !task.isCompleted } : task
      )
    );
  };

  const deleteTask = (id: string) => {
    setTasks(tasks.filter((task) => task.id !== id));
  };

  const updateTaskDetails = (id: string, field: string, value: string) => {
    setTasks(
      tasks.map((task) => (task.id === id ? { ...task, [field]: value } : task))
    );
  };

  return (
    <div className="app-container">
      <h1 className="app-title">TODO 管理アプリ</h1>

      {/* タスク追加フォーム */}
      <div className="task-input-container">
        <input
          type="text"
          value={newTask}
          onChange={(e) => setNewTask(e.target.value)}
          placeholder="タスクを入力"
          className="task-input"
        />
        <button onClick={addTask} className="add-button">
          追加
        </button>
      </div>

      {/* タスクリスト + 担当者/優先度 */}
      <ul className="task-list">
        {tasks.map((task) => (
          <li key={task.id} className="task-item">
            <input
              type="checkbox"
              checked={task.isCompleted}
              onChange={() => toggleTaskCompletion(task.id)}
              className="task-checkbox"
            />
            <span
              className={`task-text ${task.isCompleted ? "completed" : ""}`}
            >
              {task.text}
            </span>
            <button
              className="delete-button"
              onClick={() => deleteTask(task.id)}
            >
              削除
            </button>

            {/* 優先度・担当者の選択 UI */}
            <div className="flex gap-2 mt-2">
              <select
                value={task.priority}
                onChange={(e) =>
                  updateTaskDetails(task.id, "priority", e.target.value)
                }
              >
                <option value="未設定">優先度</option>
                <option value="高">高</option>
                <option value="中">中</option>
                <option value="低">低</option>
              </select>
              <select
                value={task.assignee}
                onChange={(e) =>
                  updateTaskDetails(task.id, "assignee", e.target.value)
                }
              >
                <option value="未設定">担当者</option>
                <option value="井上">井上</option>
                <option value="佐藤">佐藤</option>
              </select>
              <Button className="px-4 py-1">更新</Button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default Result;
