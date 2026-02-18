import { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { Task, Priority, TaskStatus, ViewMode } from '@/types/task';
import TaskCard from './TaskCard';
import TaskForm from './TaskForm';
import TaskFilters from './TaskFilters';
import TaskSidebar from './TaskSidebar';
import TaskGridCard from './TaskGridCard';
import CalendarView from './CalendarView';
import ActivityLog from './ActivityLog';
import BackupRestore from './BackupRestore';
import ThemeToggle from './ThemeToggle';
import { useTaskStore } from '@/hooks/useTaskStore';
import { Button } from '@/components/ui/button';
import { Plus, ListTodo, Menu, LayoutList, LayoutGrid, CalendarDays, Keyboard } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { DndContext, closestCenter, PointerSensor, useSensor, useSensors, DragEndEvent } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { toast } from 'sonner';

const viewModes: { id: ViewMode; icon: React.ElementType; label: string }[] = [
  { id: 'list', icon: LayoutList, label: 'List' },
  { id: 'grid', icon: LayoutGrid, label: 'Grid' },
  { id: 'calendar', icon: CalendarDays, label: 'Calendar' },
];

const TaskBoard = () => {
  const { tasks, activity, addTask, updateTask, deleteTask, toggleSubtask, addSubtask, deleteSubtask, reorderTasks, exportData, importData, clearActivity, stats } = useTaskStore();

  const [formOpen, setFormOpen] = useState(false);
  const [editTask, setEditTask] = useState<Task | null>(null);
  const [activeCategory, setActiveCategory] = useState('all');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<TaskStatus | 'all'>('all');
  const [priorityFilter, setPriorityFilter] = useState<Priority | 'all'>('all');
  const [mobileSidebar, setMobileSidebar] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const searchRef = useRef<HTMLInputElement>(null);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }));

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      const isInput = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable;

      if (e.key === 'Escape') {
        setFormOpen(false);
        setMobileSidebar(false);
        return;
      }

      if (isInput) return;

      if (e.key === 'n' || e.key === 'N') {
        e.preventDefault();
        setEditTask(null);
        setFormOpen(true);
      } else if (e.key === '/') {
        e.preventDefault();
        searchRef.current?.focus();
      } else if (e.key === '1') {
        setViewMode('list');
      } else if (e.key === '2') {
        setViewMode('grid');
      } else if (e.key === '3') {
        setViewMode('calendar');
      } else if (e.key === '?') {
        toast('Keyboard Shortcuts', {
          description: 'N: New task · /: Search · 1/2/3: Views · Esc: Close',
          duration: 4000,
        });
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  const filteredTasks = useMemo(() => {
    return tasks.filter(t => {
      if (activeCategory !== 'all' && t.category !== activeCategory) return false;
      if (statusFilter !== 'all' && t.status !== statusFilter) return false;
      if (priorityFilter !== 'all' && t.priority !== priorityFilter) return false;
      if (search) {
        const q = search.toLowerCase();
        return t.title.toLowerCase().includes(q) || t.description.toLowerCase().includes(q) || t.tags.some(tag => tag.toLowerCase().includes(q));
      }
      return true;
    });
  }, [tasks, activeCategory, statusFilter, priorityFilter, search]);

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) reorderTasks(active.id as string, over.id as string);
  };

  const handleEdit = (task: Task) => { setEditTask(task); setFormOpen(true); };

  const handleSubmit = (taskData: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>) => {
    if (editTask) updateTask(editTask.id, taskData);
    else addTask(taskData);
    setEditTask(null);
  };

  const renderEmptyState = () => (
    <div className="flex flex-col items-center justify-center h-full text-center">
      <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mb-4">
        <ListTodo size={28} className="text-muted-foreground" />
      </div>
      <h3 className="text-lg font-semibold mb-1">{tasks.length === 0 ? 'No tasks yet' : 'No matching tasks'}</h3>
      <p className="text-sm text-muted-foreground mb-4">{tasks.length === 0 ? 'Press N to create your first task' : 'Try adjusting your filters'}</p>
      {tasks.length === 0 && (
        <Button onClick={() => { setEditTask(null); setFormOpen(true); }} variant="outline" className="gap-2">
          <Plus size={14} /> Create Task
        </Button>
      )}
    </div>
  );

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Mobile sidebar overlay */}
      <AnimatePresence>
        {mobileSidebar && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 z-40 lg:hidden" onClick={() => setMobileSidebar(false)} />
        )}
      </AnimatePresence>

      <div className={cn("fixed inset-y-0 left-0 z-50 lg:static lg:z-auto transition-transform duration-300", mobileSidebar ? "translate-x-0" : "-translate-x-full lg:translate-x-0")}>
        <TaskSidebar activeCategory={activeCategory} onCategoryChange={id => { setActiveCategory(id); setMobileSidebar(false); }} stats={stats} />
      </div>

      <main className="flex-1 flex flex-col overflow-hidden">
        <header className="shrink-0 border-b border-border bg-card/50 glass-surface px-6 py-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <button onClick={() => setMobileSidebar(true)} className="lg:hidden p-1.5 hover:bg-muted rounded-lg">
                <Menu size={20} />
              </button>
              <div>
                <h2 className="text-xl font-bold tracking-tight">
                  {activeCategory === 'all' ? 'All Tasks' : activeCategory.charAt(0).toUpperCase() + activeCategory.slice(1)}
                </h2>
                <p className="text-sm text-muted-foreground">
                  {filteredTasks.length} task{filteredTasks.length !== 1 ? 's' : ''}
                  {search && ` matching "${search}"`}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1.5">
              {/* View toggle */}
              <div className="hidden sm:flex items-center bg-muted rounded-lg p-0.5">
                {viewModes.map(v => (
                  <Tooltip key={v.id}>
                    <TooltipTrigger asChild>
                      <button
                        onClick={() => setViewMode(v.id)}
                        className={cn("p-1.5 rounded-md transition-all", viewMode === v.id ? "bg-card shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground")}
                      >
                        <v.icon size={16} />
                      </button>
                    </TooltipTrigger>
                    <TooltipContent side="bottom" className="text-xs">{v.label}</TooltipContent>
                  </Tooltip>
                ))}
              </div>

              <BackupRestore onExport={exportData} onImport={importData} />
              <ActivityLog activity={activity} onClear={clearActivity} />
              <ThemeToggle />

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-9 w-9 hidden sm:flex" onClick={() => toast('Keyboard Shortcuts', { description: 'N: New task · /: Search · 1/2/3: Views · Esc: Close', duration: 4000 })}>
                    <Keyboard size={16} />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="text-xs">Shortcuts (?)</TooltipContent>
              </Tooltip>

              <Button onClick={() => { setEditTask(null); setFormOpen(true); }} className="gap-2 shadow-soft">
                <Plus size={16} />
                <span className="hidden sm:inline">New Task</span>
              </Button>
            </div>
          </div>
          <TaskFilters
            search={search} onSearchChange={setSearch}
            statusFilter={statusFilter} onStatusFilterChange={setStatusFilter}
            priorityFilter={priorityFilter} onPriorityFilterChange={setPriorityFilter}
            searchRef={searchRef}
          />
        </header>

        <div className="flex-1 overflow-y-auto p-6">
          {filteredTasks.length === 0 ? renderEmptyState() : (
            <>
              {viewMode === 'list' && (
                <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                  <SortableContext items={filteredTasks.map(t => t.id)} strategy={verticalListSortingStrategy}>
                    <div className="space-y-2 max-w-3xl mx-auto">
                      <AnimatePresence mode="popLayout">
                        {filteredTasks.map(task => (
                          <TaskCard key={task.id} task={task} onUpdate={updateTask} onDelete={deleteTask} onEdit={handleEdit}
                            onToggleSubtask={toggleSubtask} onAddSubtask={addSubtask} onDeleteSubtask={deleteSubtask} />
                        ))}
                      </AnimatePresence>
                    </div>
                  </SortableContext>
                </DndContext>
              )}
              {viewMode === 'grid' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 max-w-6xl mx-auto">
                  <AnimatePresence mode="popLayout">
                    {filteredTasks.map(task => (
                      <TaskGridCard key={task.id} task={task} onUpdate={updateTask} onDelete={deleteTask} onEdit={handleEdit} />
                    ))}
                  </AnimatePresence>
                </div>
              )}
              {viewMode === 'calendar' && (
                <CalendarView tasks={filteredTasks} onTaskClick={handleEdit} />
              )}
            </>
          )}
        </div>
      </main>

      <TaskForm open={formOpen} onClose={() => { setFormOpen(false); setEditTask(null); }} onSubmit={handleSubmit} editTask={editTask} />
    </div>
  );
};

export default TaskBoard;
