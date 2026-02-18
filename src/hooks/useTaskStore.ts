import { useState, useEffect, useCallback } from 'react';
import { Task, Subtask, Priority, TaskStatus } from '@/types/task';

const STORAGE_KEY = 'taskflow-tasks';

const generateId = () => Math.random().toString(36).substring(2, 12);

const loadTasks = (): Task[] => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
};

const saveTasks = (tasks: Task[]) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
};

export function useTaskStore() {
  const [tasks, setTasks] = useState<Task[]>(loadTasks);

  useEffect(() => {
    saveTasks(tasks);
  }, [tasks]);

  const addTask = useCallback((task: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>) => {
    const now = new Date().toISOString();
    const newTask: Task = { ...task, id: generateId(), createdAt: now, updatedAt: now };
    setTasks(prev => [newTask, ...prev]);
    return newTask;
  }, []);

  const updateTask = useCallback((id: string, updates: Partial<Task>) => {
    setTasks(prev => prev.map(t =>
      t.id === id ? { ...t, ...updates, updatedAt: new Date().toISOString() } : t
    ));
  }, []);

  const deleteTask = useCallback((id: string) => {
    setTasks(prev => prev.filter(t => t.id !== id));
  }, []);

  const toggleSubtask = useCallback((taskId: string, subtaskId: string) => {
    setTasks(prev => prev.map(t => {
      if (t.id !== taskId) return t;
      return {
        ...t,
        subtasks: t.subtasks.map(s =>
          s.id === subtaskId ? { ...s, completed: !s.completed } : s
        ),
        updatedAt: new Date().toISOString(),
      };
    }));
  }, []);

  const addSubtask = useCallback((taskId: string, title: string) => {
    const subtask: Subtask = { id: generateId(), title, completed: false };
    setTasks(prev => prev.map(t => {
      if (t.id !== taskId) return t;
      return { ...t, subtasks: [...t.subtasks, subtask], updatedAt: new Date().toISOString() };
    }));
  }, []);

  const deleteSubtask = useCallback((taskId: string, subtaskId: string) => {
    setTasks(prev => prev.map(t => {
      if (t.id !== taskId) return t;
      return {
        ...t,
        subtasks: t.subtasks.filter(s => s.id !== subtaskId),
        updatedAt: new Date().toISOString(),
      };
    }));
  }, []);

  const reorderTasks = useCallback((activeId: string, overId: string) => {
    setTasks(prev => {
      const oldIndex = prev.findIndex(t => t.id === activeId);
      const newIndex = prev.findIndex(t => t.id === overId);
      if (oldIndex === -1 || newIndex === -1) return prev;
      const result = [...prev];
      const [moved] = result.splice(oldIndex, 1);
      result.splice(newIndex, 0, moved);
      return result;
    });
  }, []);

  const stats = {
    total: tasks.length,
    completed: tasks.filter(t => t.status === 'completed').length,
    inProgress: tasks.filter(t => t.status === 'in-progress').length,
    pending: tasks.filter(t => t.status === 'pending').length,
    overdue: tasks.filter(t => t.dueDate && new Date(t.dueDate) < new Date() && t.status !== 'completed').length,
    completionRate: tasks.length > 0 ? Math.round((tasks.filter(t => t.status === 'completed').length / tasks.length) * 100) : 0,
  };

  return {
    tasks,
    addTask,
    updateTask,
    deleteTask,
    toggleSubtask,
    addSubtask,
    deleteSubtask,
    reorderTasks,
    stats,
  };
}
