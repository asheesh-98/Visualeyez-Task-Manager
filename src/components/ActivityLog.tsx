import { ActivityEntry } from '@/types/task';
import { format } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';
import { History, Plus, Edit3, Trash2, CheckCircle2, ArrowRight, CheckSquare, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { ScrollArea } from '@/components/ui/scroll-area';

const actionConfig: Record<string, { icon: React.ElementType; color: string; label: string }> = {
  created: { icon: Plus, color: 'text-primary', label: 'Created' },
  updated: { icon: Edit3, color: 'text-muted-foreground', label: 'Updated' },
  deleted: { icon: Trash2, color: 'text-destructive', label: 'Deleted' },
  completed: { icon: CheckCircle2, color: 'text-status-completed', label: 'Completed' },
  status_changed: { icon: ArrowRight, color: 'text-status-progress', label: 'Status changed' },
  subtask_completed: { icon: CheckSquare, color: 'text-accent', label: 'Subtask' },
};

interface ActivityLogProps {
  activity: ActivityEntry[];
  onClear: () => void;
}

const ActivityLog = ({ activity, onClear }: ActivityLogProps) => {
  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="h-9 w-9 relative">
          <History size={16} />
          {activity.length > 0 && (
            <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-primary text-primary-foreground text-[9px] font-bold flex items-center justify-center">
              {activity.length > 99 ? '99+' : activity.length}
            </span>
          )}
        </Button>
      </SheetTrigger>
      <SheetContent className="w-[380px] sm:w-[420px]">
        <SheetHeader>
          <div className="flex items-center justify-between">
            <SheetTitle className="text-lg font-bold">Activity Log</SheetTitle>
            {activity.length > 0 && (
              <Button variant="ghost" size="sm" onClick={onClear} className="text-xs text-muted-foreground">
                Clear all
              </Button>
            )}
          </div>
        </SheetHeader>
        <ScrollArea className="h-[calc(100vh-100px)] mt-4 pr-2">
          {activity.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <History size={32} className="text-muted-foreground/30 mb-3" />
              <p className="text-sm text-muted-foreground">No activity yet</p>
            </div>
          ) : (
            <div className="space-y-1">
              <AnimatePresence>
                {activity.map((entry) => {
                  const config = actionConfig[entry.action] || actionConfig.updated;
                  const Icon = config.icon;
                  return (
                    <motion.div
                      key={entry.id}
                      initial={{ opacity: 0, x: 10 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="flex items-start gap-3 py-2.5 px-2 rounded-lg hover:bg-muted/50 transition-colors"
                    >
                      <div className={`mt-0.5 shrink-0 ${config.color}`}>
                        <Icon size={14} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm">
                          <span className="font-medium">{config.label}</span>{' '}
                          <span className="text-muted-foreground">"{entry.taskTitle}"</span>
                        </p>
                        {entry.detail && <p className="text-xs text-muted-foreground mt-0.5">{entry.detail}</p>}
                        <p className="text-[10px] text-muted-foreground/60 mt-0.5 font-mono">
                          {format(new Date(entry.timestamp), 'MMM d, h:mm a')}
                        </p>
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
          )}
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
};

export default ActivityLog;
