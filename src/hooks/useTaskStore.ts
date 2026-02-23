import { useState, useEffect, useCallback } from 'react';
import { Task, Subtask, Priority, TaskStatus, ActivityEntry } from '@/types/task';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export function useTaskStore() {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [activity, setActivity] = useState<ActivityEntry[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch tasks from database
  useEffect(() => {
    if (!user) { setTasks([]); setActivity([]); setLoading(false); return; }

    const fetchData = async () => {
      setLoading(true);
      const [tasksRes, activityRes] = await Promise.all([
        supabase.from('tasks').select('*').order('sort_order', { ascending: true }).order('created_at', { ascending: false }),
        supabase.from('activity_log').select('*').order('created_at', { ascending: false }).limit(200),
      ]);

      if (tasksRes.data) {
        setTasks(tasksRes.data.map(t => ({
          id: t.id,
          title: t.title,
          description: t.description,
          priority: t.priority as Priority,
          status: t.status as TaskStatus,
          category: t.category,
          tags: t.tags || [],
          dueDate: t.due_date,
          subtasks: (t.subtasks as any[] || []) as Subtask[],
          recurrence: t.recurrence as Task['recurrence'],
          createdAt: t.created_at,
          updatedAt: t.updated_at,
        })));
      }

      if (activityRes.data) {
        setActivity(activityRes.data.map(a => ({
          id: a.id,
          taskId: a.task_id,
          taskTitle: a.task_title,
          action: a.action as ActivityEntry['action'],
          detail: a.detail || undefined,
          timestamp: a.created_at,
        })));
      }
      setLoading(false);
    };

    fetchData();
  }, [user]);

  const log = useCallback(async (taskId: string, taskTitle: string, action: ActivityEntry['action'], detail?: string) => {
    if (!user) return;
    const { data } = await supabase.from('activity_log').insert({
      user_id: user.id, task_id: taskId, task_title: taskTitle, action, detail,
    }).select().single();
    if (data) {
      setActivity(prev => [{
        id: data.id, taskId: data.task_id, taskTitle: data.task_title,
        action: data.action as ActivityEntry['action'], detail: data.detail || undefined, timestamp: data.created_at,
      }, ...prev].slice(0, 200));
    }
  }, [user]);

  const addTask = useCallback(async (task: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>) => {
    if (!user) return;
    const { data } = await supabase.from('tasks').insert({
      user_id: user.id, title: task.title, description: task.description,
      priority: task.priority, status: task.status, category: task.category,
      tags: task.tags, due_date: task.dueDate, subtasks: task.subtasks as any,
      recurrence: task.recurrence, sort_order: 0,
    }).select().single();

    if (data) {
      const newTask: Task = {
        id: data.id, title: data.title, description: data.description,
        priority: data.priority as Priority, status: data.status as TaskStatus,
        category: data.category, tags: data.tags || [], dueDate: data.due_date,
        subtasks: (data.subtasks as any[] || []) as Subtask[],
        recurrence: data.recurrence as Task['recurrence'],
        createdAt: data.created_at, updatedAt: data.updated_at,
      };
      setTasks(prev => [newTask, ...prev]);
      log(newTask.id, newTask.title, 'created');
    }
  }, [user, log]);

  const updateTask = useCallback(async (id: string, updates: Partial<Task>) => {
    if (!user) return;
    const dbUpdates: any = {};
    if (updates.title !== undefined) dbUpdates.title = updates.title;
    if (updates.description !== undefined) dbUpdates.description = updates.description;
    if (updates.priority !== undefined) dbUpdates.priority = updates.priority;
    if (updates.status !== undefined) dbUpdates.status = updates.status;
    if (updates.category !== undefined) dbUpdates.category = updates.category;
    if (updates.tags !== undefined) dbUpdates.tags = updates.tags;
    if (updates.dueDate !== undefined) dbUpdates.due_date = updates.dueDate;
    if (updates.subtasks !== undefined) dbUpdates.subtasks = updates.subtasks;
    if (updates.recurrence !== undefined) dbUpdates.recurrence = updates.recurrence;

    const { data } = await supabase.from('tasks').update(dbUpdates).eq('id', id).select().single();
    if (data) {
      const oldTask = tasks.find(t => t.id === id);
      setTasks(prev => prev.map(t => t.id !== id ? t : {
        id: data.id, title: data.title, description: data.description,
        priority: data.priority as Priority, status: data.status as TaskStatus,
        category: data.category, tags: data.tags || [], dueDate: data.due_date,
        subtasks: (data.subtasks as any[] || []) as Subtask[],
        recurrence: data.recurrence as Task['recurrence'],
        createdAt: data.created_at, updatedAt: data.updated_at,
      }));
      if (oldTask && updates.status && updates.status !== oldTask.status) {
        log(id, oldTask.title, updates.status === 'completed' ? 'completed' : 'status_changed', `→ ${updates.status}`);
      } else if (oldTask) {
        log(id, oldTask.title, 'updated');
      }
    }
  }, [user, tasks, log]);

  const deleteTask = useCallback(async (id: string) => {
    if (!user) return;
    const t = tasks.find(x => x.id === id);
    await supabase.from('tasks').delete().eq('id', id);
    setTasks(prev => prev.filter(x => x.id !== id));
    if (t) log(id, t.title, 'deleted');
  }, [user, tasks, log]);

  const toggleSubtask = useCallback(async (taskId: string, subtaskId: string) => {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;
    const updatedSubtasks = task.subtasks.map(s => s.id === subtaskId ? { ...s, completed: !s.completed } : s);
    const sub = task.subtasks.find(s => s.id === subtaskId);
    await updateTask(taskId, { subtasks: updatedSubtasks });
    if (sub) log(taskId, task.title, 'subtask_completed', sub.completed ? `Unchecked "${sub.title}"` : `Checked "${sub.title}"`);
  }, [tasks, updateTask, log]);

  const addSubtask = useCallback(async (taskId: string, title: string) => {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;
    const subtask: Subtask = { id: crypto.randomUUID(), title, completed: false };
    await updateTask(taskId, { subtasks: [...task.subtasks, subtask] });
  }, [tasks, updateTask]);

  const deleteSubtask = useCallback(async (taskId: string, subtaskId: string) => {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;
    await updateTask(taskId, { subtasks: task.subtasks.filter(s => s.id !== subtaskId) });
  }, [tasks, updateTask]);

  const reorderTasks = useCallback(async (activeId: string, overId: string) => {
    setTasks(prev => {
      const oldIndex = prev.findIndex(t => t.id === activeId);
      const newIndex = prev.findIndex(t => t.id === overId);
      if (oldIndex === -1 || newIndex === -1) return prev;
      const result = [...prev];
      const [moved] = result.splice(oldIndex, 1);
      result.splice(newIndex, 0, moved);
      // Update sort orders in background
      result.forEach((t, i) => {
        supabase.from('tasks').update({ sort_order: i }).eq('id', t.id).then(() => {});
      });
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

  const importData = useCallback(async (file: File) => {
    if (!user) return;
    const text = await file.text();
    try {
      const data = JSON.parse(text);
      if (data.tasks && Array.isArray(data.tasks)) {
        for (const task of data.tasks) {
          await supabase.from('tasks').insert({
            user_id: user.id, title: task.title, description: task.description || '',
            priority: task.priority || 'medium', status: task.status || 'pending',
            category: task.category || 'personal', tags: task.tags || [],
            due_date: task.dueDate || null, subtasks: task.subtasks || [],
            recurrence: task.recurrence || 'none', sort_order: 0,
          });
        }
        // Refetch
        const { data: fresh } = await supabase.from('tasks').select('*').order('sort_order').order('created_at', { ascending: false });
        if (fresh) {
          setTasks(fresh.map(t => ({
            id: t.id, title: t.title, description: t.description,
            priority: t.priority as Priority, status: t.status as TaskStatus,
            category: t.category, tags: t.tags || [], dueDate: t.due_date,
            subtasks: (t.subtasks as any[] || []) as Subtask[],
            recurrence: t.recurrence as Task['recurrence'],
            createdAt: t.created_at, updatedAt: t.updated_at,
          })));
        }
      }
    } catch { console.error('Invalid backup file'); }
  }, [user]);

  const clearActivity = useCallback(async () => {
    if (!user) return;
    await supabase.from('activity_log').delete().eq('user_id', user.id);
    setActivity([]);
  }, [user]);

  const stats = {
    total: tasks.length,
    completed: tasks.filter(t => t.status === 'completed').length,
    inProgress: tasks.filter(t => t.status === 'in-progress').length,
    pending: tasks.filter(t => t.status === 'pending').length,
    overdue: tasks.filter(t => t.dueDate && new Date(t.dueDate) < new Date() && t.status !== 'completed').length,
    completionRate: tasks.length > 0 ? Math.round((tasks.filter(t => t.status === 'completed').length / tasks.length) * 100) : 0,
  };

  return {
    tasks, activity, loading, addTask, updateTask, deleteTask, toggleSubtask, addSubtask,
    deleteSubtask, reorderTasks, exportData, importData, clearActivity, stats,
  };
}
