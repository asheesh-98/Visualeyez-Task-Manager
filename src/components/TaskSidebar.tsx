import { Category, DEFAULT_CATEGORIES } from '@/types/task';
import { Inbox, User, Briefcase, Heart, BookOpen, Plus, CheckCircle2, Clock, BarChart3, TrendingUp } from 'lucide-react';
import { cn } from '@/lib/utils';

const iconMap: Record<string, React.ElementType> = {
  Inbox, User, Briefcase, Heart, BookOpen,
};

interface TaskSidebarProps {
  activeCategory: string;
  onCategoryChange: (id: string) => void;
  stats: {
    total: number;
    completed: number;
    inProgress: number;
    pending: number;
    completionRate: number;
  };
}

const TaskSidebar = ({ activeCategory, onCategoryChange, stats }: TaskSidebarProps) => {
  return (
    <aside className="w-64 shrink-0 bg-sidebar text-sidebar-foreground flex flex-col h-screen border-r border-sidebar-border">
      {/* Logo */}
      <div className="p-6 pb-4">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-sidebar-primary flex items-center justify-center">
            <CheckCircle2 className="w-4.5 h-4.5 text-sidebar-primary-foreground" size={18} />
          </div>
          <h1 className="text-lg font-bold tracking-tight text-sidebar-accent-foreground">TaskFlow</h1>
        </div>
      </div>

      {/* Stats */}
      <div className="px-4 pb-4">
        <div className="bg-sidebar-accent rounded-xl p-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-sidebar-foreground/70 uppercase tracking-wider">Progress</span>
            <span className="text-xs font-mono font-semibold text-sidebar-primary">{stats.completionRate}%</span>
          </div>
          <div className="w-full h-2 bg-sidebar-border rounded-full overflow-hidden">
            <div
              className="h-full bg-sidebar-primary rounded-full transition-all duration-500 ease-out"
              style={{ width: `${stats.completionRate}%` }}
            />
          </div>
          <div className="grid grid-cols-3 gap-2 pt-1">
            <div className="text-center">
              <p className="text-lg font-bold text-sidebar-accent-foreground">{stats.pending}</p>
              <p className="text-[10px] text-sidebar-foreground/60 uppercase tracking-wider">To Do</p>
            </div>
            <div className="text-center">
              <p className="text-lg font-bold text-sidebar-accent-foreground">{stats.inProgress}</p>
              <p className="text-[10px] text-sidebar-foreground/60 uppercase tracking-wider">Active</p>
            </div>
            <div className="text-center">
              <p className="text-lg font-bold text-sidebar-accent-foreground">{stats.completed}</p>
              <p className="text-[10px] text-sidebar-foreground/60 uppercase tracking-wider">Done</p>
            </div>
          </div>
        </div>
      </div>

      {/* Categories */}
      <nav className="flex-1 px-3 space-y-0.5 overflow-y-auto">
        <p className="px-3 py-2 text-[10px] font-semibold uppercase tracking-widest text-sidebar-foreground/40">Categories</p>
        {DEFAULT_CATEGORIES.map(cat => {
          const Icon = iconMap[cat.icon] || Inbox;
          const isActive = activeCategory === cat.id;
          return (
            <button
              key={cat.id}
              onClick={() => onCategoryChange(cat.id)}
              className={cn(
                "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200",
                isActive
                  ? "bg-sidebar-accent text-sidebar-accent-foreground"
                  : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground"
              )}
            >
              <Icon size={18} className={isActive ? "text-sidebar-primary" : ""} />
              <span>{cat.name}</span>
              {cat.id === 'all' && (
                <span className="ml-auto text-xs font-mono opacity-60">{stats.total}</span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-sidebar-border">
        <div className="flex items-center gap-3 px-2">
          <div className="w-8 h-8 rounded-full bg-sidebar-accent flex items-center justify-center">
            <User size={14} className="text-sidebar-foreground" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-sidebar-accent-foreground truncate">My Workspace</p>
            <p className="text-xs text-sidebar-foreground/50">Local Storage</p>
          </div>
        </div>
      </div>
    </aside>
  );
};

export default TaskSidebar;
