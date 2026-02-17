import React, { useState, useMemo } from 'react';
import { Task, ViewMode, Category, Status, Priority } from '../types.ts';
import { Clock, User, CheckCircle2, Circle, AlertCircle, Search, Plus, Zap, MessageSquare, Trash2 } from 'lucide-react';

interface TaskBoardProps {
  tasks: Task[];
  viewMode: ViewMode | 'Overview';
  onStatusChange: (id: string, status: Status) => void;
  onDelete: (id: string) => void;
  onAddTaskToClient?: (clientName: string) => void;
  clientLabel: string;
  juniorLabel: string;
}

interface TaskRowProps {
  task: Task;
  onStatusChange: (id: string, s: Status) => void;
  onDelete: (id: string) => void;
  clientLabel: string;
}

const StatusIcon = ({ status }: { status: Status }) => {
  switch (status) {
    case Status.Completed: return <CheckCircle2 className="w-5 h-5 text-emerald-400" />;
    case Status.InProgress: return <Clock className="w-5 h-5 text-[#F0C040]" />;
    case Status.Review: return <AlertCircle className="w-5 h-5 text-amber-400" />;
    default: return <Circle className="w-5 h-5 text-white/20" />;
  }
};

const PriorityBadge = ({ priority }: { priority: Priority }) => {
  const styles = {
    [Priority.Low]: 'bg-white/5 text-white/60 border-white/10',
    [Priority.Medium]: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    [Priority.High]: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
    [Priority.Urgent]: 'bg-rose-500/20 text-rose-400 border-rose-500/30 ring-1 ring-rose-500/20',
  };
  return (
    <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-md border ${styles[priority]}`}>
      {priority === Priority.Urgent && <Zap className="w-2.5 h-2.5 inline mr-1" />}
      {priority}
    </span>
  );
};

const TaskRow: React.FC<TaskRowProps> = ({ task, onStatusChange, onDelete, clientLabel }) => {
  const isOverdue = new Date(task.deadline).setHours(0,0,0,0) <= new Date().setHours(0,0,0,0) && task.status !== Status.Completed;

  return (
    <div className="group flex items-start p-5 bg-white/[0.02] border-b border-white/[0.05] last:border-0 hover:bg-white/[0.05] transition-all">
      <button 
        onClick={() => {
          const next = task.status === Status.Completed ? Status.Pending : Status.Completed;
          onStatusChange(task.id, next);
        }}
        className="mt-1 mr-4 shrink-0 focus:outline-none transition-transform active:scale-90"
      >
        <StatusIcon status={task.status} />
      </button>
      
      <div className="flex-1 min-w-0">
        <div className="flex justify-between items-start gap-4">
          <div className="flex-1 min-w-0">
            <h4 className={`text-sm md:text-base font-medium truncate tracking-tight ${task.status === Status.Completed ? 'text-white/20 line-through' : 'text-white/90'}`}>
              {task.description}
            </h4>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <PriorityBadge priority={task.priority} />
            <span className={`text-xs font-mono px-2 py-1 rounded-lg border ${isOverdue ? 'bg-rose-500/10 text-rose-400 border-rose-500/20' : 'bg-white/5 text-white/40 border-white/5'}`}>
              {new Date(task.deadline).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
            </span>
            <button 
              onClick={(e) => {
                e.stopPropagation();
                onDelete(task.id);
              }}
              className="p-1.5 text-white/10 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-all opacity-0 group-hover:opacity-100"
              title="Delete Entry"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>
        
        <div className="mt-2 flex items-center justify-between text-xs text-white/30">
          <div className="flex items-center gap-4">
            <span className="font-bold text-white/60 tracking-tight">{task.client}</span>
            <span className="opacity-20">•</span>
            <span className="flex items-center gap-1.5">
              <User className="w-3 h-3" />
              <span className="font-medium">{task.junior || <span className="italic opacity-50">Unassigned</span>}</span>
            </span>
            <span className="opacity-20">•</span>
            <span className="uppercase tracking-widest text-[10px] font-bold text-white/20">{task.category}</span>
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
  onDelete: (id: string) => void;
  onAddClick?: () => void;
  clientLabel: string;
}

const GroupSection: React.FC<GroupSectionProps> = ({ title, tasks, onStatusChange, onDelete, onAddClick, clientLabel }) => {
  if (tasks.length === 0) return null;
  return (
    <div className="mb-10 break-inside-avoid animate-in fade-in slide-in-from-bottom-2 duration-500">
      <div className="flex items-center justify-between mb-4 px-2">
        <div className="flex items-center gap-3">
          <h3 className="text-xl font-serif-elegant font-semibold text-white/90">{title}</h3>
          <span className="text-[10px] font-black bg-white/5 text-white/40 px-2 py-0.5 rounded-full border border-white/5">{tasks.length}</span>
        </div>
        {onAddClick && (
          <button 
            onClick={onAddClick}
            className="flex items-center gap-1.5 text-[10px] font-bold text-[#F0C040] hover:text-[#F0C040]/80 bg-[#F0C040]/5 hover:bg-[#F0C040]/10 px-3 py-1.5 rounded-xl border border-[#F0C040]/20 transition-all uppercase tracking-wider"
          >
            <Plus className="w-3.5 h-3.5" />
            Add Entry
          </button>
        )}
      </div>
      <div className="bg-white/[0.03] backdrop-blur-xl rounded-[28px] border border-white/[0.08] shadow-2xl overflow-hidden">
        {tasks.map(task => (
          <TaskRow key={task.id} task={task} onStatusChange={onStatusChange} onDelete={onDelete} clientLabel={clientLabel} />
        ))}
      </div>
    </div>
  );
};

export const TaskBoard: React.FC<TaskBoardProps> = ({ tasks, viewMode, onStatusChange, onDelete, onAddTaskToClient, clientLabel, juniorLabel }) => {
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
          <div className="space-y-4">
            <GroupSection title="Priorities for Today" tasks={todayTasks} onStatusChange={onStatusChange} onDelete={onDelete} clientLabel={clientLabel} />
            {todayTasks.length === 0 && (
              <div className="text-center py-24 bg-white/[0.02] rounded-[32px] border border-dashed border-white/10 flex flex-col items-center">
                <div className="w-16 h-16 bg-white/[0.03] rounded-2xl flex items-center justify-center mb-6 border border-white/5">
                  <CheckCircle2 className="w-8 h-8 text-white/10" />
                </div>
                <h3 className="text-xl font-serif-elegant font-semibold text-white/90">All clear for today</h3>
                <p className="text-white/30 text-sm max-w-xs mx-auto mt-2">No high-priority items currently tagged for today's workspace flow.</p>
              </div>
            )}
          </div>
        );
      }
      case 'Client': {
        const clients: string[] = Array.from<string>(new Set(filteredTasks.map(t => t.client))).sort();
        return (
          <div className="space-y-4">
            {clients.map((client) => (
              <GroupSection key={client} title={client} tasks={filteredTasks.filter(t => t.client === client)} onStatusChange={onStatusChange} onDelete={onDelete} onAddClick={() => onAddTaskToClient?.(client)} clientLabel={clientLabel} />
            ))}
          </div>
        );
      }
      case 'Category': {
        return (
          <div className="space-y-4">
            {Object.values(Category).map((cat) => (
              <GroupSection key={cat} title={cat as string} tasks={filteredTasks.filter(t => t.category === cat)} onStatusChange={onStatusChange} onDelete={onDelete} clientLabel={clientLabel} />
            ))}
          </div>
        );
      }
      case 'Junior': {
        const juniors: string[] = Array.from<string>(new Set(filteredTasks.map(t => t.junior || 'Unassigned'))).sort();
        return (
          <div className="space-y-4">
            {juniors.map((junior) => (
              <GroupSection key={junior} title={junior} tasks={filteredTasks.filter(t => (t.junior || 'Unassigned') === junior)} onStatusChange={onStatusChange} onDelete={onDelete} clientLabel={clientLabel} />
            ))}
          </div>
        );
      }
      default: return null;
    }
  };

  return (
    <div className="px-8 md:px-12 pt-6 animate-in slide-in-from-bottom-4 duration-700 relative z-10">
      <div className="mb-10 relative group">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20 group-focus-within:text-[#F0C040] transition-colors" />
        <input 
          type="text" 
          value={searchQuery} 
          onChange={(e) => setSearchQuery(e.target.value)} 
          placeholder={`Search operational records...`} 
          className="w-full pl-12 pr-6 py-4 bg-white/[0.03] border border-white/[0.08] rounded-2xl focus:outline-none focus:ring-4 focus:ring-[#F0C040]/5 focus:border-[#F0C040]/30 transition-all text-sm text-white placeholder-white/20 shadow-xl backdrop-blur-md" 
        />
      </div>
      
      <div className="pb-12">
        {filteredTasks.length === 0 ? (
          <div className="text-center py-24 bg-white/[0.02] rounded-[32px] border border-dashed border-white/10">
            <Search className="w-12 h-12 text-white/5 mx-auto mb-6" />
            <h3 className="text-xl font-serif-elegant font-semibold text-white/90">No matching records found</h3>
            <p className="text-white/20 text-sm mt-2">Refine your search parameters to find the data you're looking for.</p>
          </div>
        ) : renderContent()}
      </div>
    </div>
  );
};
