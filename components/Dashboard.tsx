
import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend } from 'recharts';
import { Task, Category, Status } from '../types.ts';

interface DashboardProps {
  tasks: Task[];
}

const COLORS = ['#0f172a', '#334155', '#475569', '#64748b', '#94a3b8'];

export const Dashboard: React.FC<DashboardProps> = ({ tasks }) => {
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
  const juniorData = Object.entries(juniorMap).map(([name, count]) => ({ name, count }));

  // Quick Stats
  const activeTasks = tasks.filter(t => t.status !== Status.Completed).length;
  const urgentTasks = tasks.filter(t => {
    const d = new Date(t.deadline);
    const now = new Date();
    const diff = (d.getTime() - now.getTime()) / (1000 * 3600 * 24);
    return diff <= 2 && t.status !== Status.Completed;
  }).length;

  return (
    <div className="p-6 space-y-8 animate-in fade-in duration-500">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <h3 className="text-slate-500 text-sm font-medium uppercase tracking-wider">Active Tasks</h3>
          <p className="text-4xl font-bold text-slate-900 mt-2">{activeTasks}</p>
        </div>
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <h3 className="text-slate-500 text-sm font-medium uppercase tracking-wider">Urgent (48h)</h3>
          <p className="text-4xl font-bold text-rose-600 mt-2">{urgentTasks}</p>
        </div>
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <h3 className="text-slate-500 text-sm font-medium uppercase tracking-wider">Total Pursuits</h3>
          <p className="text-4xl font-bold text-blue-600 mt-2">
            {tasks.filter(t => t.category === Category.Pursuits).length}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 h-80">
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col">
          <h3 className="text-slate-800 font-semibold mb-4">Workload Distribution (Category)</h3>
          <div className="flex-1 min-h-0">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={categoryData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  fill="#8884d8"
                  paddingAngle={5}
                  dataKey="value"
                >
                  {categoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col">
          <h3 className="text-slate-800 font-semibold mb-4">Junior Associate Load</h3>
          <div className="flex-1 min-h-0">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={juniorData} layout="vertical" margin={{ top: 5, right: 30, left: 40, bottom: 5 }}>
                <XAxis type="number" hide />
                <YAxis type="category" dataKey="name" width={80} tick={{fontSize: 12}} />
                <Tooltip cursor={{fill: 'transparent'}} />
                <Bar dataKey="count" fill="#475569" radius={[0, 4, 4, 0]} barSize={20} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};
