import { Task, Priority, TaskStatus } from '@/types/task';
import { cn } from '@/lib/utils';
import { Calendar, CheckCircle2, Circle, Clock, MoreHorizontal, Trash2, Edit3, Repeat } from 'lucide-react';
import { format, isPast, isToday } from 'date-fns';
import { motion } from 'framer-motion';
import { Badge } from '@/components/ui/badge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';

const priorityConfig: Record<Priority, { label: string; dot: string }> = {
  high: { label: 'High', dot: 'bg-priority-high' },
  medium: { label: 'Medium', dot: 'bg-priority-medium' },
  low: { label: 'Low', dot: 'bg-priority-low' },
};

const statusConfig: Record<TaskStatus, { icon: React.ElementType; class: string }> = {
  pending: { icon: Circle, class: 'text-status-pending' },
  'in-progress': { icon: Clock, class: 'text-status-progress' },
  completed: { icon: CheckCircle2, class: 'text-status-completed' },
};

interface TaskGridCardProps {
  task: Task;
  onUpdate: (id: string, updates: Partial<Task>) => void;
  onDelete: (id: string) => void;
  onEdit: (task: Task) => void;
}

const TaskGridCard = ({ task, onUpdate, onDelete, onEdit }: TaskGridCardProps) => {
  const priority = priorityConfig[task.priority];
  const status = statusConfig[task.status];
  const StatusIcon = status.icon;
  const isOverdue = task.dueDate && isPast(new Date(task.dueDate)) && task.status !== 'completed';
  const subtasksDone = task.subtasks.filter(s => s.completed).length;
  const subtasksTotal = task.subtasks.length;

  const cycleStatus = () => {
    const order: TaskStatus[] = ['pending', 'in-progress', 'completed'];
    const idx = order.indexOf(task.status);
    onUpdate(task.id, { status: order[(idx + 1) % 3] });
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className={cn(
        "group bg-card rounded-xl border border-border p-4 shadow-card hover:shadow-elevated transition-all duration-200 flex flex-col",
        task.status === 'completed' && "opacity-60"
      )}
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <button onClick={cycleStatus} className="shrink-0 mt-0.5">
          <StatusIcon size={18} className={cn(status.class, "transition-colors")} />
        </button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-muted rounded-md">
              <MoreHorizontal size={14} className="text-muted-foreground" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-36">
            <DropdownMenuItem onClick={() => onEdit(task)}><Edit3 size={14} className="mr-2" /> Edit</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => onDelete(task.id)} className="text-destructive"><Trash2 size={14} className="mr-2" /> Delete</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <h3 className={cn("text-sm font-semibold mb-1 leading-snug", task.status === 'completed' && "line-through text-muted-foreground")}>
        {task.title}
      </h3>
      {task.description && <p className="text-xs text-muted-foreground line-clamp-2 mb-3">{task.description}</p>}

      <div className="mt-auto flex items-center justify-between pt-3 border-t border-border">
        <div className="flex items-center gap-2">
          <div className={cn("w-2 h-2 rounded-full", priority.dot)} />
          {task.dueDate && (
            <span className={cn("text-[11px] font-medium flex items-center gap-1", isOverdue ? "text-destructive" : "text-muted-foreground")}>
              <Calendar size={10} />{format(new Date(task.dueDate), 'MMM d')}
            </span>
          )}
          {task.recurrence && task.recurrence !== 'none' && (
            <Repeat size={10} className="text-primary" />
          )}
        </div>
        {subtasksTotal > 0 && (
          <span className="text-[11px] text-muted-foreground">{subtasksDone}/{subtasksTotal}</span>
        )}
      </div>

      {task.tags.length > 0 && (
        <div className="flex gap-1 flex-wrap mt-2">
          {task.tags.slice(0, 3).map(tag => (
            <Badge key={tag} variant="secondary" className="text-[9px] px-1.5 py-0 h-4">{tag}</Badge>
          ))}
        </div>
      )}
    </motion.div>
  );
};

export default TaskGridCard;
