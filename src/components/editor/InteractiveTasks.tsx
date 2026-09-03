import React, { useState } from 'react';
import { Check, Plus, Trash2 } from 'lucide-react';

export interface TaskItem {
  lineIndex: number;
  text: string;
  isCompleted: boolean;
}

interface InteractiveTasksProps {
  tasks: TaskItem[];
  onToggleTask: (lineIndex: number) => void;
  onAddTask: (afterLineIndex: number, text: string) => void;
  onDeleteTask: (lineIndex: number) => void;
  isReadOnly?: boolean;
}

export const InteractiveTasks: React.FC<InteractiveTasksProps> = ({
  tasks,
  onToggleTask,
  onAddTask,
  onDeleteTask,
  isReadOnly = false
}) => {
  const [isAdding, setIsAdding] = useState(false);
  const [newTaskText, setNewTaskText] = useState('');

  const handleAddNewTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskText.trim()) return;
    const lastIndex = tasks[tasks.length - 1]?.lineIndex ?? 0;
    onAddTask(lastIndex, newTaskText.trim());
    setNewTaskText('');
    setIsAdding(false);
  };

  return (
    <div className="interactive-tasks-card">
      <div className="tasks-header">
        <span className="tasks-title">Checklist</span>
        <span className="tasks-progress-badge">
          {tasks.filter((t) => t.isCompleted).length}/{tasks.length} Completed
        </span>
      </div>

      <div className="tasks-list-body">
        {tasks.map((task) => (
          <div
            key={`task-${task.lineIndex}`}
            className={`interactive-task-row ${task.isCompleted ? 'completed' : ''}`}
          >
            <button
              type="button"
              className={`task-checkbox-btn ${task.isCompleted ? 'checked' : ''}`}
              onClick={() => onToggleTask(task.lineIndex)}
              title={task.isCompleted ? 'Mark as incomplete' : 'Mark as complete'}
            >
              {task.isCompleted && <Check size={12} strokeWidth={3} />}
            </button>

            <span
              className="task-label-text"
              onClick={() => onToggleTask(task.lineIndex)}
            >
              {task.text}
            </span>

            {!isReadOnly && (
              <button
                type="button"
                className="task-delete-btn"
                onClick={() => onDeleteTask(task.lineIndex)}
                title="Remove task"
              >
                <Trash2 size={12} />
              </button>
            )}
          </div>
        ))}
      </div>

      {!isReadOnly && (
        <div className="tasks-footer-action">
          {isAdding ? (
            <form onSubmit={handleAddNewTask} className="task-add-form">
              <input
                type="text"
                autoFocus
                className="task-add-input"
                placeholder="Type task description & press Enter..."
                value={newTaskText}
                onChange={(e) => setNewTaskText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Escape') setIsAdding(false);
                }}
              />
              <div className="task-add-buttons">
                <button type="submit" className="btn-task-confirm">Add</button>
                <button type="button" className="btn-task-cancel" onClick={() => setIsAdding(false)}>Cancel</button>
              </div>
            </form>
          ) : (
            <button
              type="button"
              className="btn-add-task-trigger"
              onClick={() => setIsAdding(true)}
            >
              <Plus size={13} />
              <span>Add Task</span>
            </button>
          )}
        </div>
      )}
    </div>
  );
};
