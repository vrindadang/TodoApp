import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import { Task, Category, Status } from '../types.ts';
import { Plus } from 'lucide-react';

interface DashboardProps {
  tasks: Task[];
  onAddClick?: () => void;
  orgName: string;
}

const COLORS = ['#F0C040', '#3B82F6', '#8B5CF6', '#10B981', '#EC4899'];

export const Dashboard: React.FC<DashboardProps> = ({ tasks, onAddClick, orgName }) => {
  // Aggregate for Categories
  const categoryData = Object.values(Category).map(cat => ({
    name: cat,
    value: tasks.filter(t => t.category === cat).length
  })).filter(d => d.value > 0);

  // Aggregate for Juniors
  const juniorMap: Record<string, number> = {};
  tasks.forEach(t => {
    if (t.junior) {
      juniorMap[t.junior] = (juniorMap[t.junior] || 0) + 1;
    }
  });
  const juniorData = Object.entries(juniorMap)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count);

  // Quick Stats
  const activeTasksCount = tasks.filter(t => t.status !== Status.Completed).length;
  const pursuitsCount = tasks.filter(t => t.category === Category.Pursuits).length;

  return (
    <div className="p-6 md:p-12 animate-in fade-in slide-in-from-bottom-2 duration-1000 relative z-10">
      {/* Header Section */}
      <div className="flex justify-between items-start mb-12">
        <div>
          <p className="text-[#F0C040] text-[11px] font-bold tracking-[0.2em] uppercase mb-2">Dashboard</p>
          <h1 className="text-4xl md:text-5xl font-serif-elegant font-semibold tracking-tight text-white">{orgName} Ops</h1>
        </div>
        <button 
          onClick={onAddClick}
          className="w-12 h-12 md:w-14 md:h-14 bg-white/[0.05] border border-white/10 rounded-2xl flex items-center justify-center hover:bg-white/10 transition-all group shadow-2xl"
        >
          <Plus className="w-6 h-6 text-[#F0C040] group-hover:scale-110 transition-transform" />
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        {/* Active Tasks Card */}
        <div className="bg-white/[0.03] backdrop-blur-xl border border-white/[0.08] p-8 rounded-[32px] shadow-2xl group hover:border-white/[0.15] transition-all">
          <p className="text-white/40 text-[11px] font-bold uppercase tracking-[0.15em] mb-4">Active Tasks</p>
          <div className="flex items-baseline gap-4">
            <span className="text-6xl font-serif-elegant text-[#F0C040]">{activeTasksCount}</span>
          </div>
          <p className="text-white/30 text-sm mt-4 font-medium">In progress</p>
        </div>

        {/* Total Pursuits Card */}
        <div className="bg-white/[0.03] backdrop-blur-xl border border-white/[0.08] p-8 rounded-[32px] shadow-2xl group hover:border-white/[0.15] transition-all">
          <p className="text-white/40 text-[11px] font-bold uppercase tracking-[0.15em] mb-4">Total Pursuits</p>
          <div className="flex items-baseline gap-4">
            <span className="text-6xl font-serif-elegant text-blue-400">{pursuitsCount}</span>
          </div>
          <p className="text-white/30 text-sm mt-4 font-medium">This quarter</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Workload by Category */}
        <div className="bg-white/[0.03] backdrop-blur-xl border border-white/[0.08] p-8 rounded-[36px] shadow-2xl flex flex-col">
          <h3 className="text-xl font-serif-elegant font-semibold mb-8 text-white">Workload by Category</h3>
          <div className="flex flex-col md:flex-row items-center gap-12 flex-1">
            <div className="w-48 h-48 relative">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categoryData.length > 0 ? categoryData : [{ name: 'Empty', value: 1 }]}
                    cx="50%"
                    cy="50%"
                    innerRadius={65}
                    outerRadius={85}
                    paddingAngle={8}
                    dataKey="value"
                    stroke="none"
                  >
                    {categoryData.length > 0 ? categoryData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    )) : <Cell fill="rgba(255,255,255,0.05)" />}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-2xl font-bold text-white">100%</span>
                <span className="text-[10px] uppercase tracking-widest text-white/40">assigned</span>
              </div>
            </div>

            <div className="flex-1 w-full space-y-5">
              {categoryData.map((item, idx) => (
                <div key={item.name} className="flex items-center justify-between group">
                  <div className="flex items-center gap-3">
                    <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS[idx % COLORS.length] }} />
                    <span className="text-sm font-medium text-white/70 group-hover:text-white transition-colors">{item.name}</span>
                  </div>
                  <span className="text-sm font-bold text-white/90">
                    {tasks.length > 0 ? Math.round((item.value / tasks.length) * 100) : 0}%
                  </span>
                </div>
              ))}
              {categoryData.length === 0 && (
                <p className="text-white/20 text-xs italic">No operational data available</p>
              )}
            </div>
          </div>
        </div>

        {/* Junior Associate Load */}
        <div className="bg-white/[0.03] backdrop-blur-xl border border-white/[0.08] p-8 rounded-[36px] shadow-2xl flex flex-col">
          <h3 className="text-xl font-serif-elegant font-semibold mb-8 text-white">Junior Associate Load</h3>
          <div className="space-y-8 flex-1">
            {juniorData.length > 0 ? juniorData.slice(0, 5).map((junior, idx) => {
              const percentage = Math.min((junior.count / (tasks.length || 1)) * 100 * 2, 100);
              return (
                <div key={junior.name} className="space-y-3">
                  <div className="flex justify-between items-end">
                    <span className="text-sm font-medium text-white/70">{junior.name}</span>
                    <span className="text-xs font-bold text-white/40">{junior.count} tasks</span>
                  </div>
                  <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden border border-white/5">
                    <div 
                      className="h-full rounded-full transition-all duration-1000 ease-out shadow-[0_0_10px_rgba(255,255,255,0.1)]"
                      style={{ 
                        width: `${percentage}%`,
                        backgroundColor: COLORS[idx % COLORS.length]
                      }}
                    />
                  </div>
                </div>
              );
            }) : (
              <div className="h-full flex flex-col items-center justify-center text-center py-12">
                <p className="text-white/20 text-sm font-medium italic">No associates currently logged</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
