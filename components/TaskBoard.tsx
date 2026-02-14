
import React, { useState, useMemo } from 'react';
import { Task, ViewMode, Category, Status, Priority } from '../types.ts';
import { Clock, User, CheckCircle2, Circle, AlertCircle, Search, Plus, Zap, MessageSquare } from 'lucide-react';

interface TaskBoardProps {
  tasks: Task[];
  viewMode: ViewMode | 'Overview';
  onStatusChange: (id: string, status: Status) => void;
  onAddTaskToClient?: (clientName: string) => void;
  clientLabel: string;
  juniorLabel: string;
}

interface TaskRowProps {
  task: Task;
  onStatusChange: (id: string, s: Status) => void;
  clientLabel: string;
}

const StatusIcon = ({ status }: { status: Status }) => {
  switch (status) {
    case Status.Completed: return <CheckCircle2 className="w-5 h-5 text-emerald-500" />;
    case Status.InProgress: return <Clock className="w-5 h-5 text-blue-500" />;
    case Status.Review: return <AlertCircle className="w-5 h-5 text-amber-500" />;
    default: return <Circle className="w-5 h-5 text-slate-300" />;
  }
};

const PriorityBadge = ({ priority }: { priority: Priority }) => {
  const styles = {
    [Priority.Low]: 'bg-slate-100 text-slate-600',
    [Priority.Medium]: 'bg-blue-50 text-blue-600',
    [Priority.High]: 'bg-orange-50 text-orange-600',
    [Priority.Urgent]: 'bg-rose-50 text-rose-600',
  };
  return (
    <span className={`text-[10px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded ${styles[priority]}`}>
      {priority === Priority.Urgent && <Zap className="w-2.5 h-2.5 inline mr-1" />}
      {priority}
    </span>
  );
};

const TaskRow: React.FC<TaskRowProps> = ({ task, onStatusChange, clientLabel }) => {
  const isOverdue = new Date(task.deadline).setHours(0,0,0,0) <= new Date().setHours(0,0,0,0) && task.status !== Status.Completed;

  return (
    <div className="group flex items-start p-4 bg-white border-b border-slate-100 last:border-0 hover:bg-slate-50 transition-colors">
      <button 
        onClick={() => {
          const next = task.status === Status.Completed ? Status.Pending : Status.Completed;
          onStatusChange(task.id, next);
        }}
        className="mt-1 mr-4 shrink-0 focus:outline-none"
      >
        <StatusIcon status={task.status} />
      </button>
      
      <div className="flex-1 min-w-0">
        <div className="flex justify-between items-start gap-4">
          <div className="flex-1 min-w-0">
            <h4 className={`text-sm font-medium truncate ${task.status === Status.Completed ? 'text-slate-400 line-through' : 'text-slate-900'}`}>
              {task.description}
            </h4>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <PriorityBadge priority={task.priority} />
            <span className={`text-xs font-mono px-2 py-1 rounded-full ${isOverdue ? 'bg-rose-100 text-rose-700' : 'bg-slate-100 text-slate-600'}`}>
              {new Date(task.deadline).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
            </span>
          </div>
        </div>
        
        <div className="mt-1 flex items-center justify-between text-xs text-slate-500">
          <div className="flex items-center gap-4">
            <span className="font-semibold text-slate-700">{task.client}</span>
            <span>•</span>
            <span className="flex items-center gap-1">
              <User className="w-3 h-3" />
              {task.junior || <span className="italic text-slate-400">Unassigned</span>}
            </span>
            <span>•</span>
            <span className="uppercase tracking-wider text-[10px]">{task.category}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

interface GroupSectionProps {
  title: string;
  tasks: Task[];
  onStatusChange: (id: string, s: Status) => void;
  onAddClick?: () => void;
  clientLabel: string;
}

const GroupSection: React.FC<GroupSectionProps> = ({ title, tasks, onStatusChange, onAddClick, clientLabel }) => {
  if (tasks.length === 0) return null;
  return (
    <div className="mb-8 break-inside-avoid">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <h3 className="text-lg font-bold text-slate-800">{title}</h3>
          <span className="text-xs font-semibold bg-slate-200 text-slate-600 px-2 py-0.5 rounded-full">{tasks.length}</span>
        </div>
        {onAddClick && (
          <button 
            onClick={onAddClick}
            className="flex items-center gap-1 text-xs font-bold text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-lg transition-colors"
          >
            <Plus className="w-3 h-3" />
            Add Entry
          </button>
        )}
      </div>
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        {tasks.map(task => (
          <TaskRow key={task.id} task={task} onStatusChange={onStatusChange} clientLabel={clientLabel} />
        ))}
      </div>
    </div>
  );
};

export const TaskBoard: React.FC<TaskBoardProps> = ({ tasks, viewMode, onStatusChange, onAddTaskToClient, clientLabel, juniorLabel }) => {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredTasks = useMemo(() => {
    const sorted = [...tasks].sort((a, b) => {
      const pMap = { Urgent: 0, High: 1, Medium: 2, Low: 3 };
      return pMap[a.priority] - pMap[b.priority];
    });

    if (!searchQuery) return sorted;
    const lowerQuery = searchQuery.toLowerCase();
    return sorted.filter(t => 
      t.description.toLowerCase().includes(lowerQuery) || 
      t.client.toLowerCase().includes(lowerQuery) ||
      (t.junior && t.junior.toLowerCase().includes(lowerQuery)) ||
      t.category.toLowerCase().includes(lowerQuery)
    );
  }, [tasks, searchQuery]);

  const renderContent = () => {
    switch (viewMode) {
      case 'Today': {
        const todayStr = new Date().toISOString().split('T')[0];
        const todayTasks = filteredTasks.filter(t => t.deadline === todayStr);
        return (
          <div className="space-y-2">
            <GroupSection title="Priorities for Today" tasks={todayTasks} onStatusChange={onStatusChange} clientLabel={clientLabel} />
            {todayTasks.length === 0 && (
              <div className="text-center py-20 bg-slate-50 rounded-2xl border border-dashed border-slate-300">
                <CheckCircle2 className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-slate-900">All clear for today</h3>
                <p className="text-slate-500">No priority items found for this workspace today.</p>
              </div>
            )}
          </div>
        );
      }
      case 'Client': {
        const clients: string[] = Array.from<string>(new Set(filteredTasks.map(t => t.client))).sort();
        return (
          <div className="space-y-2">
            {clients.map((client) => (
              <GroupSection key={client} title={client} tasks={filteredTasks.filter(t => t.client === client)} onStatusChange={onStatusChange} onAddClick={() => onAddTaskToClient?.(client)} clientLabel={clientLabel} />
            ))}
          </div>
        );
      }
      case 'Category': {
        return (
          <div className="space-y-2">
            {Object.values(Category).map((cat) => (
              <GroupSection key={cat} title={cat as string} tasks={filteredTasks.filter(t => t.category === cat)} onStatusChange={onStatusChange} clientLabel={clientLabel} />
            ))}
          </div>
        );
      }
      case 'Junior': {
        const juniors: string[] = Array.from<string>(new Set(filteredTasks.map(t => t.junior || 'Unassigned'))).sort();
        return (
          <div className="space-y-2">
            {juniors.map((junior) => (
              <GroupSection key={junior} title={junior} tasks={filteredTasks.filter(t => (t.junior || 'Unassigned') === junior)} onStatusChange={onStatusChange} clientLabel={clientLabel} />
            ))}
          </div>
        );
      }
      default: return null;
    }
  };

  return (
    <div className="px-6 animate-in slide-in-from-bottom-4 duration-500">
      <div className="mb-6 relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder={`Search across entries...`} className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 transition-all text-sm shadow-sm" />
      </div>
      {filteredTasks.length === 0 ? (
        <div className="text-center py-20 bg-slate-50 rounded-2xl border border-dashed border-slate-300">
          <Search className="w-12 h-12 text-slate-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-slate-900">No matching entries</h3>
        </div>
      ) : renderContent()}
    </div>
  );
};
