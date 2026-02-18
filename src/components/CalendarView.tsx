import { Task } from '@/types/task';
import { cn } from '@/lib/utils';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isSameMonth, startOfWeek, endOfWeek, isToday } from 'date-fns';
import { ChevronLeft, ChevronRight, Circle, Clock, CheckCircle2 } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';

const statusIcons = {
  pending: Circle,
  'in-progress': Clock,
  completed: CheckCircle2,
};

const priorityDots: Record<string, string> = {
  high: 'bg-priority-high',
  medium: 'bg-priority-medium',
  low: 'bg-priority-low',
};

interface CalendarViewProps {
  tasks: Task[];
  onTaskClick: (task: Task) => void;
}

const CalendarView = ({ tasks, onTaskClick }: CalendarViewProps) => {
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const calStart = startOfWeek(monthStart);
  const calEnd = endOfWeek(monthEnd);
  const days = eachDayOfInterval({ start: calStart, end: calEnd });

  const getTasksForDay = (day: Date) =>
    tasks.filter(t => t.dueDate && isSameDay(new Date(t.dueDate), day));

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-bold">{format(currentMonth, 'MMMM yyyy')}</h3>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setCurrentMonth(m => new Date(m.getFullYear(), m.getMonth() - 1))}>
            <ChevronLeft size={16} />
          </Button>
          <Button variant="ghost" size="sm" className="h-8 text-xs" onClick={() => setCurrentMonth(new Date())}>Today</Button>
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setCurrentMonth(m => new Date(m.getFullYear(), m.getMonth() + 1))}>
            <ChevronRight size={16} />
          </Button>
        </div>
      </div>

      {/* Day names */}
      <div className="grid grid-cols-7 mb-2">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
          <div key={d} className="text-center text-[11px] font-semibold text-muted-foreground uppercase tracking-wider py-2">{d}</div>
        ))}
      </div>

      {/* Days grid */}
      <div className="grid grid-cols-7 gap-px bg-border rounded-xl overflow-hidden">
        {days.map((day, i) => {
          const dayTasks = getTasksForDay(day);
          const inMonth = isSameMonth(day, currentMonth);
          const today = isToday(day);
          return (
            <div
              key={i}
              className={cn(
                "bg-card min-h-[100px] p-2 transition-colors",
                !inMonth && "opacity-40",
                today && "bg-[hsl(var(--calendar-today))]"
              )}
            >
              <span className={cn(
                "text-xs font-medium inline-flex items-center justify-center w-6 h-6 rounded-full",
                today && "bg-primary text-primary-foreground"
              )}>
                {format(day, 'd')}
              </span>
              <div className="mt-1 space-y-0.5">
                {dayTasks.slice(0, 3).map(task => (
                  <motion.button
                    key={task.id}
                    whileHover={{ scale: 1.02 }}
                    onClick={() => onTaskClick(task)}
                    className="w-full text-left flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium bg-muted/50 hover:bg-muted truncate transition-colors"
                  >
                    <div className={cn("w-1.5 h-1.5 rounded-full shrink-0", priorityDots[task.priority])} />
                    <span className="truncate">{task.title}</span>
                  </motion.button>
                ))}
                {dayTasks.length > 3 && (
                  <span className="text-[10px] text-muted-foreground pl-1">+{dayTasks.length - 3} more</span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default CalendarView;
