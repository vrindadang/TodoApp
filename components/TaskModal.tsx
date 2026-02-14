
import React, { useState, useEffect } from 'react';
import { X, ChevronRight, Briefcase, Rocket, FileText, Settings, HeartHandshake } from 'lucide-react';
import { Category, Priority, Task } from '../types.ts';

interface TaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  // onSave now excludes 'org' from its expected Task parameter
  onSave: (task: Omit<Task, 'id' | 'createdAt' | 'status' | 'org'>) => void;
  existingClients: string[];
  existingJuniors: string[];
  prefillData?: Partial<Task> | null;
  clientLabel: string;
  juniorLabel: string;
}

const CategoryIcon = ({ category }: { category: Category }) => {
  switch (category) {
    case Category.Deliverables: return <Briefcase className="w-4 h-4" />;
    case Category.Pursuits: return <Rocket className="w-4 h-4" />;
    case Category.Proposals: return <FileText className="w-4 h-4" />;
    case Category.AdminWork: return <Settings className="w-4 h-4" />;
    default: return null;
  }
};

export const TaskModal: React.FC<TaskModalProps> = ({ 
  isOpen, 
  onClose, 
  onSave, 
  existingClients, 
  existingJuniors,
  prefillData,
  clientLabel,
  juniorLabel
}) => {
  const isSKRM = clientLabel === 'Sewa Category';
  
  const [description, setDescription] = useState('');
  const [client, setClient] = useState('');
  const [junior, setJunior] = useState('');
  const [category, setCategory] = useState<Category>(isSKRM ? Category.General : Category.Deliverables);
  const [deadline, setDeadline] = useState(new Date().toISOString().split('T')[0]);
  const [priority, setPriority] = useState<Priority>(Priority.Medium);

  useEffect(() => {
    if (isOpen) {
      setDescription(prefillData?.description || '');
      setClient(prefillData?.client || '');
      setJunior(prefillData?.junior || '');
      setCategory(prefillData?.category || (isSKRM ? Category.General : Category.Deliverables));
      setDeadline(prefillData?.deadline || new Date().toISOString().split('T')[0]);
      setPriority(prefillData?.priority || Priority.Medium);
    }
  }, [isOpen, prefillData, isSKRM]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!description || !client) return;
    
    // Org is purposely omitted here as the parent component handles it.
    onSave({
      description,
      client,
      junior: junior || null,
      category,
      deadline,
      priority,
    });
    
    onClose();
  };

  const priorityColors = {
    [Priority.Low]: 'bg-slate-100 text-slate-600',
    [Priority.Medium]: 'bg-blue-100 text-blue-700',
    [Priority.High]: 'bg-orange-100 text-orange-700',
    [Priority.Urgent]: 'bg-rose-100 text-rose-700',
  };

  const ClientIcon = isSKRM ? HeartHandshake : Briefcase;

  const getStepNumber = (n: number) => {
    if (!isSKRM) return n;
    return n > 2 ? n - 1 : n;
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div>
            <h3 className="font-bold text-slate-900 text-lg">New Entry</h3>
            <p className="text-xs text-slate-500 font-medium">Record operational details</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-lg transition-colors text-slate-400 hover:text-slate-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-5 overflow-y-auto max-h-[80vh]">
          {/* 1. Client/Sewa Selection */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-blue-600">
              <span className="flex items-center justify-center w-5 h-5 rounded-full bg-blue-600 text-[10px] text-white font-bold">1</span>
              <label className="text-xs font-bold uppercase tracking-wider">{clientLabel}</label>
            </div>
            <div className="relative">
               <ClientIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
               <input 
                autoFocus={!client}
                required
                list="clients-list"
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium"
                placeholder={`Search or add ${clientLabel.toLowerCase()}...`}
                value={client}
                onChange={(e) => setClient(e.target.value)}
              />
            </div>
            <datalist id="clients-list">
              {existingClients.map(c => <option key={c} value={c} />)}
            </datalist>
          </div>

          {/* 2. Category Selection (Hidden for SKRM) */}
          {!isSKRM && (
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-slate-700">
                <span className="flex items-center justify-center w-5 h-5 rounded-full bg-slate-700 text-[10px] text-white font-bold">2</span>
                <label className="text-xs font-bold uppercase tracking-wider">Classification</label>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {[Category.Deliverables, Category.AdminWork, Category.Pursuits, Category.Proposals].map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setCategory(cat)}
                    className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-xs font-bold transition-all ${
                      category === cat 
                        ? 'bg-slate-900 text-white border-slate-900 shadow-lg shadow-slate-900/10' 
                        : 'bg-white text-slate-500 border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <CategoryIcon category={cat} />
                    {cat === Category.AdminWork ? 'Admin' : cat}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* 3. Task Details */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-slate-700">
              <span className="flex items-center justify-center w-5 h-5 rounded-full bg-slate-700 text-[10px] text-white font-bold">{getStepNumber(3)}</span>
              <label className="text-xs font-bold uppercase tracking-wider">Description</label>
            </div>
            <textarea 
              autoFocus={!!client}
              required
              rows={2}
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm resize-none"
              placeholder="What needs to be done?"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          {/* 4. & 5. Junior and Timeline */}
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-slate-700">
                <span className="flex items-center justify-center w-5 h-5 rounded-full bg-slate-700 text-[10px] text-white font-bold">{getStepNumber(4)}</span>
                <label className="text-xs font-bold uppercase tracking-wider">Assigned {juniorLabel}</label>
              </div>
              <input 
                list="juniors-list"
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm"
                placeholder="Name..."
                value={junior}
                onChange={(e) => setJunior(e.target.value)}
              />
              <datalist id="juniors-list">
                {existingJuniors.map(j => <option key={j} value={j} />)}
              </datalist>
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-slate-700">
                <span className="flex items-center justify-center w-5 h-5 rounded-full bg-slate-700 text-[10px] text-white font-bold">{getStepNumber(5)}</span>
                <label className="text-xs font-bold uppercase tracking-wider">Deadline</label>
              </div>
              <input 
                type="date"
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm"
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
              />
            </div>
          </div>

          {/* 6. Priority Selection */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-slate-700">
              <span className="flex items-center justify-center w-5 h-5 rounded-full bg-slate-700 text-[10px] text-white font-bold">{getStepNumber(6)}</span>
              <label className="text-xs font-bold uppercase tracking-wider">Priority Level</label>
            </div>
            <div className="grid grid-cols-4 gap-2">
              {Object.values(Priority).map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setPriority(p)}
                  className={`py-2 rounded-lg text-[10px] font-bold transition-all border ${
                    priority === p 
                      ? `${priorityColors[p]} border-current shadow-sm` 
                      : 'bg-white border-slate-200 text-slate-400 hover:border-slate-300'
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>

          <div className="pt-4 flex gap-3">
            <button 
              type="button" 
              onClick={onClose}
              className="px-6 py-4 text-slate-500 font-bold text-sm hover:text-slate-700 transition-colors"
            >
              Cancel
            </button>
            <button 
              type="submit"
              className="flex-1 px-6 py-4 bg-slate-900 text-white font-bold rounded-xl hover:bg-black shadow-xl shadow-slate-900/20 transition-all active:scale-[0.98] flex items-center justify-center gap-2"
            >
              Commit Entry
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
