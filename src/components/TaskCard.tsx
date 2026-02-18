import { Task, Priority, TaskStatus } from '@/types/task';
import { cn } from '@/lib/utils';
import { Calendar, MoreHorizontal, Trash2, Edit3, CheckCircle2, Circle, Clock, GripVertical, ChevronDown, ChevronRight, Plus, X, Repeat } from 'lucide-react';
import { format, isPast, isToday } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';

const priorityConfig: Record<Priority, { label: string; class: string; dot: string }> = {
  high: { label: 'High', class: 'text-priority-high', dot: 'bg-priority-high' },
  medium: { label: 'Medium', class: 'text-priority-medium', dot: 'bg-priority-medium' },
  low: { label: 'Low', class: 'text-priority-low', dot: 'bg-priority-low' },
};

const statusConfig: Record<TaskStatus, { label: string; icon: React.ElementType; class: string }> = {
  pending: { label: 'To Do', icon: Circle, class: 'text-status-pending' },
  'in-progress': { label: 'In Progress', icon: Clock, class: 'text-status-progress' },
  completed: { label: 'Done', icon: CheckCircle2, class: 'text-status-completed' },
};

interface TaskCardProps {
  task: Task;
  onUpdate: (id: string, updates: Partial<Task>) => void;
  onDelete: (id: string) => void;
  onEdit: (task: Task) => void;
  onToggleSubtask: (taskId: string, subtaskId: string) => void;
  onAddSubtask: (taskId: string, title: string) => void;
  onDeleteSubtask: (taskId: string, subtaskId: string) => void;
}

const TaskCard = ({ task, onUpdate, onDelete, onEdit, onToggleSubtask, onAddSubtask, onDeleteSubtask }: TaskCardProps) => {
  const [expanded, setExpanded] = useState(false);
  const [newSubtask, setNewSubtask] = useState('');
  const [addingSubtask, setAddingSubtask] = useState(false);

  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: task.id });
  const style = { transform: CSS.Transform.toString(transform), transition };

  const priority = priorityConfig[task.priority];
  const status = statusConfig[task.status];
  const StatusIcon = status.icon;
  const isOverdue = task.dueDate && isPast(new Date(task.dueDate)) && task.status !== 'completed';
  const isDueToday = task.dueDate && isToday(new Date(task.dueDate));
  const subtasksDone = task.subtasks.filter(s => s.completed).length;
  const subtasksTotal = task.subtasks.length;
  const subtaskProgress = subtasksTotal > 0 ? (subtasksDone / subtasksTotal) * 100 : 0;

  const cycleStatus = () => {
    const order: TaskStatus[] = ['pending', 'in-progress', 'completed'];
    const idx = order.indexOf(task.status);
    onUpdate(task.id, { status: order[(idx + 1) % 3] });
  };

  const handleAddSubtask = () => {
    if (newSubtask.trim()) {
      onAddSubtask(task.id, newSubtask.trim());
      setNewSubtask('');
      setAddingSubtask(false);
    }
  };

  return (
    <motion.div
      ref={setNodeRef}
      style={style}
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: isDragging ? 0.5 : 1, y: 0 }}
      exit={{ opacity: 0, x: -20, transition: { duration: 0.2 } }}
      className={cn(
        "group bg-card rounded-xl border border-border p-4 shadow-card hover:shadow-elevated transition-all duration-200",
        task.status === 'completed' && "opacity-60",
        isDragging && "shadow-elevated z-50"
      )}
    >
      <div className="flex items-start gap-3">
        <button {...attributes} {...listeners} className="mt-1 opacity-0 group-hover:opacity-40 hover:!opacity-100 transition-opacity cursor-grab active:cursor-grabbing">
          <GripVertical size={14} />
        </button>

        <button onClick={cycleStatus} className="mt-0.5 shrink-0">
          <StatusIcon size={20} className={cn(status.class, "transition-colors")} />
        </button>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <h3 className={cn("text-sm font-semibold leading-snug", task.status === 'completed' && "line-through text-muted-foreground")}>
              {task.title}
            </h3>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-muted rounded-md">
                  <MoreHorizontal size={14} className="text-muted-foreground" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-40">
                <DropdownMenuItem onClick={() => onEdit(task)}><Edit3 size={14} className="mr-2" /> Edit</DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => onDelete(task.id)} className="text-destructive"><Trash2 size={14} className="mr-2" /> Delete</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {task.description && <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{task.description}</p>}

          {/* Progress bar for subtasks */}
          {subtasksTotal > 0 && (
            <div className="mt-2 flex items-center gap-2">
              <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-accent rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${subtaskProgress}%` }}
                  transition={{ duration: 0.4 }}
                />
              </div>
              <span className="text-[10px] font-mono text-muted-foreground">{Math.round(subtaskProgress)}%</span>
            </div>
          )}

          <div className="flex items-center gap-2 mt-3 flex-wrap">
            <div className="flex items-center gap-1.5">
              <div className={cn("w-1.5 h-1.5 rounded-full", priority.dot)} />
              <span className={cn("text-[11px] font-medium", priority.class)}>{priority.label}</span>
            </div>

            {task.dueDate && (
              <div className={cn("flex items-center gap-1 text-[11px] font-medium", isOverdue ? "text-destructive" : isDueToday ? "text-accent" : "text-muted-foreground")}>
                <Calendar size={11} />
                <span>{format(new Date(task.dueDate), 'MMM d')}</span>
              </div>
            )}

            {task.recurrence && task.recurrence !== 'none' && (
              <div className="flex items-center gap-1 text-[11px] font-medium text-primary">
                <Repeat size={11} />
                <span className="capitalize">{task.recurrence}</span>
              </div>
            )}

            {task.tags.map(tag => (
              <Badge key={tag} variant="secondary" className="text-[10px] px-1.5 py-0 h-4 font-medium">{tag}</Badge>
            ))}

            {subtasksTotal > 0 && (
              <button onClick={() => setExpanded(!expanded)} className="flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground transition-colors ml-auto">
                {expanded ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
                {subtasksDone}/{subtasksTotal}
              </button>
            )}
          </div>

          <AnimatePresence>
            {expanded && subtasksTotal > 0 && (
              <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                <div className="mt-3 pt-3 border-t border-border space-y-1.5">
                  {task.subtasks.map(sub => (
                    <div key={sub.id} className="flex items-center gap-2 group/sub">
                      <Checkbox checked={sub.completed} onCheckedChange={() => onToggleSubtask(task.id, sub.id)} className="h-3.5 w-3.5" />
                      <span className={cn("text-xs flex-1", sub.completed && "line-through text-muted-foreground")}>{sub.title}</span>
                      <button onClick={() => onDeleteSubtask(task.id, sub.id)} className="opacity-0 group-hover/sub:opacity-100 transition-opacity">
                        <X size={12} className="text-muted-foreground hover:text-destructive" />
                      </button>
                    </div>
                  ))}
                  {addingSubtask ? (
                    <div className="flex items-center gap-1.5 mt-1">
                      <Input value={newSubtask} onChange={e => setNewSubtask(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleAddSubtask()} placeholder="Subtask title..." className="h-7 text-xs" autoFocus />
                      <Button size="sm" onClick={handleAddSubtask} className="h-7 px-2 text-xs">Add</Button>
                      <Button size="sm" variant="ghost" onClick={() => { setAddingSubtask(false); setNewSubtask(''); }} className="h-7 px-2 text-xs"><X size={12} /></Button>
                    </div>
                  ) : (
                    <button onClick={() => setAddingSubtask(true)} className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors pt-1">
                      <Plus size={12} /> Add subtask
                    </button>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  );
};

export default TaskCard;
