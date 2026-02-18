export type Priority = 'low' | 'medium' | 'high';
export type TaskStatus = 'pending' | 'in-progress' | 'completed';

export interface Subtask {
  id: string;
  title: string;
  completed: boolean;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  priority: Priority;
  status: TaskStatus;
  category: string;
  tags: string[];
  dueDate: string | null;
  subtasks: Subtask[];
  createdAt: string;
  updatedAt: string;
}

export interface Category {
  id: string;
  name: string;
  icon: string;
  color: string;
}

export const DEFAULT_CATEGORIES: Category[] = [
  { id: 'all', name: 'All Tasks', icon: 'Inbox', color: 'primary' },
  { id: 'personal', name: 'Personal', icon: 'User', color: 'accent' },
  { id: 'work', name: 'Work', icon: 'Briefcase', color: 'status-progress' },
  { id: 'health', name: 'Health', icon: 'Heart', color: 'priority-high' },
  { id: 'learning', name: 'Learning', icon: 'BookOpen', color: 'priority-low' },
];
