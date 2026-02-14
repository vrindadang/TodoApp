
import React, { useState, useEffect } from 'react';
import { X, Send, Copy, Check, Sparkles, Loader2, MessageSquare, AlertTriangle } from 'lucide-react';
import { Task, Status, FollowUpDraft } from '../types.ts';
import { generateFollowUpDraft } from '../services/geminiService.ts';

interface FollowUpModalProps {
  isOpen: boolean;
  onClose: () => void;
  tasks: Task[];
  userName: string;
}

export const FollowUpModal: React.FC<FollowUpModalProps> = ({ isOpen, onClose, tasks, userName }) => {
  const [drafts, setDrafts] = useState<FollowUpDraft[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const overdueTasks = tasks.filter(t => 
    (t.status === Status.Pending || t.status === Status.InProgress) && 
    (new Date(t.deadline).setHours(0,0,0,0) <= new Date().setHours(0,0,0,0))
  );

  useEffect(() => {
    if (isOpen && overdueTasks.length > 0 && drafts.length === 0) {
      handleGenerateAll();
    }
  }, [isOpen]);

  const handleGenerateAll = async () => {
    setIsGenerating(true);
    const newDrafts: FollowUpDraft[] = [];
    
    // Process in sequence to be polite to the API, or in small chunks
    for (const task of overdueTasks) {
      const message = await generateFollowUpDraft(task, userName);
      newDrafts.push({
        taskId: task.id,
        recipient: task.junior || 'Associate',
        message: message,
        taskDescription: task.description
      });
    }
    
    setDrafts(newDrafts);
    setIsGenerating(false);
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[140] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-300">
      <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl border border-slate-200 overflow-hidden animate-in zoom-in-95 duration-300 flex flex-col max-h-[85vh]">
        <div className="px-8 py-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-indigo-600 rounded-xl shadow-lg shadow-indigo-600/20">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-xl tracking-tight">AI Nudge Agent</h3>
              <p className="text-sm text-slate-500 font-medium">Drafting follow-ups for {overdueTasks.length} pending items</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-full transition-colors text-slate-400">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-8 space-y-6 bg-slate-50/30">
          {overdueTasks.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="w-16 h-16 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center mb-4">
                <Check className="w-8 h-8" />
              </div>
              <h4 className="text-lg font-bold text-slate-900">Workspace Clear</h4>
              <p className="text-slate-500 max-w-xs mx-auto">No pending tasks are currently overdue. You're all caught up!</p>
            </div>
          ) : isGenerating ? (
            <div className="flex flex-col items-center justify-center py-20">
              <Loader2 className="w-10 h-10 text-indigo-500 animate-spin mb-4" />
              <p className="text-slate-500 font-medium animate-pulse">Generating personalized follow-up drafts...</p>
            </div>
          ) : (
            drafts.map((draft) => (
              <div key={draft.taskId} className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden group hover:border-indigo-300 transition-all">
                <div className="px-5 py-3 bg-slate-50 border-b border-slate-100 flex justify-between items-center">
                   <div className="flex items-center gap-2">
                     <span className="w-2 h-2 rounded-full bg-rose-500" />
                     <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">Overdue: {draft.taskDescription}</span>
                   </div>
                   <span className="text-[10px] font-black text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded uppercase">To: {draft.recipient}</span>
                </div>
                <div className="p-5 relative">
                  <p className="text-slate-700 text-sm leading-relaxed pr-10">"{draft.message}"</p>
                  <button 
                    onClick={() => copyToClipboard(draft.message, draft.taskId)}
                    className={`absolute bottom-5 right-5 p-2 rounded-lg transition-all ${
                      copiedId === draft.taskId ? 'bg-emerald-500 text-white shadow-lg' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                    }`}
                  >
                    {copiedId === draft.taskId ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="px-8 py-6 border-t border-slate-100 bg-white flex justify-between items-center">
          <p className="text-xs text-slate-400 font-medium max-w-[60%] italic">
            Messages are drafted based on workspace context. Copy a message to send it via Teams, Email, or WhatsApp.
          </p>
          <button
            onClick={onClose}
            className="px-8 py-3 bg-slate-900 text-white font-bold rounded-xl hover:bg-black transition-all shadow-lg"
          >
            Done for now
          </button>
        </div>
      </div>
    </div>
  );
};
