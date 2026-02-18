import { TaskStatus, Priority } from '@/types/task';
import { Search, SlidersHorizontal, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { useState, RefObject } from 'react';

interface TaskFiltersProps {
  search: string;
  onSearchChange: (value: string) => void;
  statusFilter: TaskStatus | 'all';
  onStatusFilterChange: (value: TaskStatus | 'all') => void;
  priorityFilter: Priority | 'all';
  onPriorityFilterChange: (value: Priority | 'all') => void;
  searchRef?: RefObject<HTMLInputElement>;
}

const TaskFilters = ({
  search, onSearchChange,
  statusFilter, onStatusFilterChange,
  priorityFilter, onPriorityFilterChange,
  searchRef,
}: TaskFiltersProps) => {
  const [showFilters, setShowFilters] = useState(false);
  const hasFilters = statusFilter !== 'all' || priorityFilter !== 'all' || search.length > 0;

  const clearAll = () => { onSearchChange(''); onStatusFilterChange('all'); onPriorityFilterChange('all'); };

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            ref={searchRef}
            value={search}
            onChange={e => onSearchChange(e.target.value)}
            placeholder="Search tasks... (press /)"
            className="pl-9 h-10 bg-card border-border"
          />
          {search && (
            <button onClick={() => onSearchChange('')} className="absolute right-3 top-1/2 -translate-y-1/2">
              <X size={14} className="text-muted-foreground" />
            </button>
          )}
        </div>
        <Button variant={showFilters ? "default" : "outline"} size="sm" onClick={() => setShowFilters(!showFilters)} className="h-10 gap-1.5">
          <SlidersHorizontal size={14} />
          Filters
          {hasFilters && <Badge variant="secondary" className="ml-1 h-4 px-1 text-[10px]">!</Badge>}
        </Button>
      </div>

      {showFilters && (
        <div className="flex items-center gap-2 animate-fade-in flex-wrap">
          <Select value={statusFilter} onValueChange={v => onStatusFilterChange(v as TaskStatus | 'all')}>
            <SelectTrigger className="w-36 h-9 text-xs"><SelectValue placeholder="Status" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="pending">To Do</SelectItem>
              <SelectItem value="in-progress">In Progress</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
            </SelectContent>
          </Select>
          <Select value={priorityFilter} onValueChange={v => onPriorityFilterChange(v as Priority | 'all')}>
            <SelectTrigger className="w-36 h-9 text-xs"><SelectValue placeholder="Priority" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Priority</SelectItem>
              <SelectItem value="high">🔴 High</SelectItem>
              <SelectItem value="medium">🟡 Medium</SelectItem>
              <SelectItem value="low">🟢 Low</SelectItem>
            </SelectContent>
          </Select>
          {hasFilters && (
            <Button variant="ghost" size="sm" onClick={clearAll} className="h-9 text-xs text-muted-foreground">Clear all</Button>
          )}
        </div>
      )}
    </div>
  );
};

export default TaskFilters;
