import { useState, useEffect, useCallback } from 'react';
import { Task, Subtask, Priority, TaskStatus, ActivityEntry } from '@/types/task';

const STORAGE_KEY = 'taskflow-tasks';
const ACTIVITY_KEY = 'taskflow-activity';

const generateId = () => Math.random().toString(36).substring(2, 12);

const loadTasks = (): Task[] => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch { return []; }
};

const saveTasks = (tasks: Task[]) => localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));

const loadActivity = (): ActivityEntry[] => {
  try {
    const stored = localStorage.getItem(ACTIVITY_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch { return []; }
};

const saveActivity = (activity: ActivityEntry[]) =>
  localStorage.setItem(ACTIVITY_KEY, JSON.stringify(activity.slice(0, 200)));

export function useTaskStore() {
  const [tasks, setTasks] = useState<Task[]>(loadTasks);
  const [activity, setActivity] = useState<ActivityEntry[]>(loadActivity);

  useEffect(() => { saveTasks(tasks); }, [tasks]);
  useEffect(() => { saveActivity(activity); }, [activity]);

  const log = useCallback((taskId: string, taskTitle: string, action: ActivityEntry['action'], detail?: string) => {
    setActivity(prev => [{ id: generateId(), taskId, taskTitle, action, detail, timestamp: new Date().toISOString() }, ...prev].slice(0, 200));
  }, []);

  const addTask = useCallback((task: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>) => {
    const now = new Date().toISOString();
    const newTask: Task = { ...task, id: generateId(), createdAt: now, updatedAt: now };
    setTasks(prev => [newTask, ...prev]);
    log(newTask.id, newTask.title, 'created');
    return newTask;
  }, [log]);

  const updateTask = useCallback((id: string, updates: Partial<Task>) => {
    setTasks(prev => prev.map(t => {
      if (t.id !== id) return t;
      const updated = { ...t, ...updates, updatedAt: new Date().toISOString() };
      if (updates.status && updates.status !== t.status) {
        log(id, t.title, updates.status === 'completed' ? 'completed' : 'status_changed', `→ ${updates.status}`);
      } else {
        log(id, t.title, 'updated');
      }
      return updated;
    }));
  }, [log]);

  const deleteTask = useCallback((id: string) => {
    setTasks(prev => {
      const t = prev.find(x => x.id === id);
      if (t) log(id, t.title, 'deleted');
      return prev.filter(x => x.id !== id);
    });
  }, [log]);

  const toggleSubtask = useCallback((taskId: string, subtaskId: string) => {
    setTasks(prev => prev.map(t => {
      if (t.id !== taskId) return t;
      const sub = t.subtasks.find(s => s.id === subtaskId);
      if (sub) log(taskId, t.title, 'subtask_completed', sub.completed ? `Unchecked "${sub.title}"` : `Checked "${sub.title}"`);
      return {
        ...t,
        subtasks: t.subtasks.map(s => s.id === subtaskId ? { ...s, completed: !s.completed } : s),
        updatedAt: new Date().toISOString(),
      };
    }));
  }, [log]);

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
      return { ...t, subtasks: t.subtasks.filter(s => s.id !== subtaskId), updatedAt: new Date().toISOString() };
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

  const exportData = useCallback(() => {
    const data = JSON.stringify({ tasks, activity, exportedAt: new Date().toISOString() }, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `taskflow-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, [tasks, activity]);

  const importData = useCallback((file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target?.result as string);
        if (data.tasks) setTasks(data.tasks);
        if (data.activity) setActivity(data.activity);
      } catch { console.error('Invalid backup file'); }
    };
    reader.readAsText(file);
  }, []);

  const clearActivity = useCallback(() => setActivity([]), []);

  const stats = {
    total: tasks.length,
    completed: tasks.filter(t => t.status === 'completed').length,
    inProgress: tasks.filter(t => t.status === 'in-progress').length,
    pending: tasks.filter(t => t.status === 'pending').length,
    overdue: tasks.filter(t => t.dueDate && new Date(t.dueDate) < new Date() && t.status !== 'completed').length,
    completionRate: tasks.length > 0 ? Math.round((tasks.filter(t => t.status === 'completed').length / tasks.length) * 100) : 0,
  };

  return {
    tasks, activity, addTask, updateTask, deleteTask, toggleSubtask, addSubtask,
    deleteSubtask, reorderTasks, exportData, importData, clearActivity, stats,
  };
}
