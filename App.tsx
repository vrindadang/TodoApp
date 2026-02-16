import React, { useState, useMemo, useEffect } from 'react';
import { Users, Briefcase, Filter, Scale, Plus, Building2, LogOut, Settings, Database, Star, HeartHandshake, Sparkles, MessageSquare, Loader2, BarChart3, LayoutDashboard, MoreHorizontal, ChevronUp, AlertTriangle } from 'lucide-react';
import { Task, Category, Status, ViewMode, Priority, ExtractedActionable } from './types.ts';
import { TaskBoard } from './components/TaskBoard.tsx';
import { Dashboard } from './components/Dashboard.tsx';
import { TaskModal } from './components/TaskModal.tsx';
import { ProfileModal } from './components/ProfileModal.tsx';
import { MasterListModal } from './components/MasterListModal.tsx';
import { ActionExtractionModal } from './components/ActionExtractionModal.tsx';
import { FollowUpModal } from './components/FollowUpModal.tsx';
import { supabase } from './services/supabaseClient.ts';

type Org = 'EY' | 'SKRM' | null;
type AppViewMode = ViewMode | 'Overview';

function App() {
  // Persistence: Initialize state from localStorage
  const [currentOrg, setCurrentOrg] = useState<Org>(() => {
    return localStorage.getItem('exec_ops_org') as Org || null;
  });
  const [viewMode, setViewMode] = useState<AppViewMode>(() => {
    return (localStorage.getItem('exec_ops_view') as AppViewMode) || 'Today';
  });

  const [userName, setUserName] = useState('Anmol Bhatia');
  const [userDesignation, setUserDesignation] = useState('Director, EY');
  
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  
  const [eyClients, setEyClients] = useState<string[]>(['Tiger Global', 'Acme Corp', 'Personal', 'Internal']);
  const [skrmSewa, setSkrmSewa] = useState<string[]>(['DEF', 'Canteen', 'Security', 'Green Room']);
  const [juniorMasterList, setJuniorMasterList] = useState<string[]>(['Rahul', 'Sarah']);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isMasterModalOpen, setIsMasterModalOpen] = useState(false);
  const [isExtractionModalOpen, setIsExtractionModalOpen] = useState(false);
  const [isNudgeModalOpen, setIsNudgeModalOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  const [lastConfirmation, setLastConfirmation] = useState<string | null>(null);

  // Persistence: Save to localStorage when state changes
  useEffect(() => {
    if (currentOrg) {
      localStorage.setItem('exec_ops_org', currentOrg);
    } else {
      localStorage.removeItem('exec_ops_org');
    }
  }, [currentOrg]);

  useEffect(() => {
    localStorage.setItem('exec_ops_view', viewMode);
  }, [viewMode]);

  useEffect(() => {
    const fetchTasks = async () => {
      setIsLoading(true);
      setFetchError(null);
      try {
        const { data, error } = await supabase
          .from('tasks')
          .select('*')
          .order('created_at', { ascending: false });

        if (error) throw error;
        
        const mappedTasks: Task[] = (data || []).map(item => ({
          id: item.id,
          description: item.description,
          client: item.client,
          org: item.org,
          category: item.category as Category,
          deadline: item.deadline,
          junior: item.junior,
          status: item.status as Status,
          priority: item.priority as Priority,
          createdAt: item.created_at ? new Date(item.created_at).getTime() : Date.now()
        }));
        
        setTasks(mappedTasks);
      } catch (err: any) {
        console.error("Error fetching tasks:", err);
        setFetchError(err.message || "Failed to connect to the database.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchTasks();
  }, []);

  const clientLabel = currentOrg === 'SKRM' ? 'Sewa Category' : 'Client';
  const juniorLabel = currentOrg === 'SKRM' ? 'Sewadar' : 'Associate';
  const ClientIcon = currentOrg === 'SKRM' ? HeartHandshake : Briefcase;

  const currentOrgTasks = useMemo(() => {
    return tasks.filter(t => t.org === currentOrg);
  }, [tasks, currentOrg]);

  const activeClientList = currentOrg === 'SKRM' ? skrmSewa : eyClients;

  const existingClients = useMemo(() => {
    const fromTasks = currentOrgTasks.map(t => t.client);
    return Array.from(new Set([...activeClientList, ...fromTasks])).sort();
  }, [currentOrgTasks, activeClientList]);

  const existingJuniors = useMemo(() => {
    const fromTasks = currentOrgTasks.filter(t => t.junior).map(t => t.junior!);
    return Array.from(new Set([...juniorMasterList, ...fromTasks])).sort();
  }, [currentOrgTasks, juniorMasterList]);

  const addTask = async (taskData: Omit<Task, 'id' | 'createdAt' | 'status' | 'org'>) => {
    if (!currentOrg) return;
    
    const newTaskObj = {
      org: currentOrg,
      category: taskData.category || Category.General,
      description: taskData.description || 'New Entry',
      client: taskData.client || (currentOrg === 'SKRM' ? 'DEF' : 'General'),
      deadline: taskData.deadline || new Date().toISOString().split('T')[0],
      priority: taskData.priority || Priority.Medium,
      junior: taskData.junior || null,
      status: Status.Pending
    };

    try {
      const { data, error } = await supabase
        .from('tasks')
        .insert([newTaskObj])
        .select()
        .single();

      if (error) throw error;

      if (data) {
        const savedTask: Task = {
          id: data.id,
          ...newTaskObj,
          createdAt: data.created_at ? new Date(data.created_at).getTime() : Date.now()
        };
        setTasks(prev => [savedTask, ...prev]);
        setLastConfirmation(`Record committed for ${savedTask.client}`);
      } else {
        setLastConfirmation(`Record submitted successfully.`);
      }
      
      setTimeout(() => setLastConfirmation(null), 3000);
    } catch (err: any) {
      console.error("Error adding task:", err);
      alert(`Save failed: ${err.message}`);
    }
  };

  const deleteTask = async (id: string) => {
    if (!window.confirm("Are you sure you want to permanently delete this entry?")) return;
    
    try {
      const { error } = await supabase
        .from('tasks')
        .delete()
        .eq('id', id);

      if (error) throw error;
      setTasks(prev => prev.filter(t => t.id !== id));
      setLastConfirmation("Entry deleted successfully.");
      setTimeout(() => setLastConfirmation(null), 3000);
    } catch (err: any) {
      console.error("Error deleting task:", err);
      alert(`Delete failed: ${err.message}`);
    }
  };

  const handleConfirmExtracted = async (extracted: ExtractedActionable[]) => {
    if (!currentOrg) return;
    
    const newTasksData = extracted.map(e => ({
      org: currentOrg,
      description: e.description,
      client: e.client,
      deadline: e.deadline || new Date().toISOString().split('T')[0],
      category: e.category,
      priority: e.priority,
      junior: e.suggestedJunior || null,
      status: Status.Pending
    }));

    try {
      const { data, error } = await supabase
        .from('tasks')
        .insert(newTasksData)
        .select();

      if (error) throw error;

      if (data && Array.isArray(data)) {
        const savedTasks: Task[] = data.map(item => ({
          id: item.id,
          description: item.description,
          client: item.client,
          org: item.org,
          category: item.category as Category,
          deadline: item.deadline,
          junior: item.junior,
          status: item.status as Status,
          priority: item.priority as Priority,
          createdAt: item.created_at ? new Date(item.created_at).getTime() : Date.now()
        }));

        setTasks(prev => [...savedTasks, ...prev]);
        setLastConfirmation(`Extracted and added ${savedTasks.length} tasks.`);
      }
      
      setTimeout(() => setLastConfirmation(null), 4000);
    } catch (err: any) {
      console.error("Error bulk adding tasks:", err);
      alert(`Extraction commit failed: ${err.message}`);
    }
  };

  const updateTaskStatus = async (id: string, status: Status) => {
    try {
      const { error } = await supabase
        .from('tasks')
        .update({ status })
        .eq('id', id);

      if (error) throw error;
      setTasks(prev => prev.map(t => t.id === id ? { ...t, status } : t));
    } catch (err) {
      console.error("Error updating status:", err);
    }
  };

  const NavButton = ({ mode, icon: Icon, label, onClick }: { mode?: AppViewMode, icon: any, label: string, onClick?: () => void }) => (
    <button
      onClick={onClick || (() => mode && setViewMode(mode))}
      className={`flex items-center gap-3 px-4 py-3 w-full rounded-xl transition-all duration-200 ${
        mode === viewMode 
          ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' 
          : 'text-slate-500 hover:bg-slate-100'
      }`}
    >
      <Icon className="w-5 h-5" />
      <span className="font-medium text-sm">{label}</span>
    </button>
  );

  const getInitials = (name: string) => name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);

  if (!currentOrg) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 font-sans">
        <div className="w-full max-w-2xl space-y-12 animate-in fade-in zoom-in-95 duration-500">
          <div className="text-center space-y-4">
            <div className="inline-flex items-center justify-center p-3 bg-slate-900 rounded-2xl mb-4 shadow-xl shadow-slate-900/20">
              <Scale className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight">Executive Ops</h1>
            <p className="text-slate-500 text-lg font-medium">Select Workspace to begin</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <button onClick={() => setCurrentOrg('EY')} className="group bg-white p-8 rounded-3xl border border-slate-200 shadow-sm hover:shadow-2xl hover:border-yellow-400 hover:-translate-y-1 transition-all duration-300">
              <div className="flex flex-col items-center">
                <div className="w-20 h-20 bg-yellow-400 rounded-2xl flex items-center justify-center mb-6 shadow-lg"><span className="text-3xl font-black text-slate-900">EY</span></div>
                <h2 className="text-2xl font-black text-slate-900">EY Workspace</h2>
              </div>
            </button>
            <button onClick={() => setCurrentOrg('SKRM')} className="group bg-white p-8 rounded-3xl border border-slate-200 shadow-sm hover:shadow-2xl hover:border-slate-900 hover:-translate-y-1 transition-all duration-300">
              <div className="flex flex-col items-center">
                <div className="w-20 h-20 bg-slate-900 rounded-2xl flex items-center justify-center mb-6 shadow-lg"><span className="text-3xl font-black text-white">SKRM</span></div>
                <h2 className="text-2xl font-black text-slate-900">SKRM Workspace</h2>
              </div>
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex font-sans text-slate-900">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-slate-200 flex flex-col fixed inset-y-0 left-0 z-10 hidden md:flex">
        <div className="p-6 overflow-y-auto custom-scrollbar">
          <div className="flex items-center gap-3 text-slate-900 mb-8">
            <div className={`p-2 rounded-lg ${currentOrg === 'EY' ? 'bg-yellow-400' : 'bg-slate-900'}`}>
              <Building2 className={`w-6 h-6 ${currentOrg === 'EY' ? 'text-slate-900' : 'text-white'}`} />
            </div>
            <div>
              <h1 className="font-bold text-lg leading-tight">{currentOrg}</h1>
              <p className="text-[10px] text-slate-500 font-bold tracking-widest uppercase">Workspace</p>
            </div>
          </div>
          <nav className="space-y-2">
            <NavButton mode="Overview" icon={LayoutDashboard} label="Executive Overview" />
            <NavButton mode="Today" icon={Star} label="Today's Priority" />
            <NavButton mode="Client" icon={ClientIcon} label={`By ${clientLabel}`} />
            <NavButton mode="Category" icon={Filter} label="By Category" />
            <NavButton mode="Junior" icon={Users} label={`By ${juniorLabel}`} />
            
            <div className="mt-4 pt-4 border-t border-slate-100">
              <h4 className="px-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">AI Tools</h4>
              <button onClick={() => setIsExtractionModalOpen(true)} className="flex items-center gap-3 px-4 py-3 w-full rounded-xl transition-all duration-200 text-blue-600 hover:bg-blue-50 font-bold">
                <span className="shrink-0"><Sparkles className="w-5 h-5" /></span>
                <span className="text-sm">Extract Actions</span>
              </button>
              <button onClick={() => setIsNudgeModalOpen(true)} className="flex items-center gap-3 px-4 py-3 w-full rounded-xl transition-all duration-200 text-indigo-600 hover:bg-indigo-50 font-bold mt-1">
                <span className="shrink-0"><MessageSquare className="w-5 h-5" /></span>
                <span className="text-sm">Nudge Agent</span>
              </button>
            </div>
          </nav>
        </div>
        <div className="mt-auto p-6 border-t border-slate-100 space-y-4">
          <button onClick={() => setIsProfileModalOpen(true)} className="flex items-center gap-3 w-full p-2 rounded-xl hover:bg-slate-50 transition-all text-left group">
            <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center shrink-0 border border-slate-200"><span className="font-bold text-slate-600">{getInitials(userName)}</span></div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-slate-900 truncate">{userName}</p>
              <p className="text-[10px] text-slate-500 font-medium truncate uppercase tracking-tighter">{userDesignation}</p>
            </div>
            <Settings className="w-3.5 h-3.5 text-slate-300" />
          </button>
          <button onClick={() => setCurrentOrg(null)} className="flex items-center gap-2 text-xs font-bold text-rose-600 hover:text-rose-700 w-full px-2">
            <LogOut className="w-3.5 h-3.5" />
            Switch Workspace
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 md:ml-64 relative flex flex-col min-h-screen pb-24 md:pb-12">
        <header className="bg-white/80 backdrop-blur-sm border-b border-slate-200 px-6 py-4 flex items-center justify-between md:hidden sticky top-0 z-20">
          <div className="flex items-center gap-2 font-bold"><Building2 className="w-6 h-6" /> {currentOrg} Ops</div>
          <button onClick={() => setIsModalOpen(true)} className="p-2 bg-slate-900 text-white rounded-lg"><Plus className="w-5 h-5" /></button>
        </header>

        <div className="flex-1">
          {isLoading ? (
             <div className="flex flex-col items-center justify-center h-96">
               <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
               <p className="text-slate-500 mt-4 font-medium">Syncing data...</p>
             </div>
          ) : fetchError ? (
            <div className="flex flex-col items-center justify-center h-96 p-8 text-center max-w-md mx-auto">
               <div className="w-16 h-16 bg-rose-50 text-rose-600 rounded-2xl flex items-center justify-center mb-4">
                 <AlertTriangle className="w-8 h-8" />
               </div>
               <h3 className="text-lg font-bold text-slate-900">Connection Failed</h3>
               <p className="text-slate-500 mt-2 text-sm">{fetchError}</p>
               <button 
                onClick={() => window.location.reload()}
                className="mt-6 px-6 py-2 bg-slate-900 text-white rounded-xl font-bold text-sm"
               >
                 Retry Connection
               </button>
             </div>
          ) : (
            <>
              <div className="px-6 md:px-8 pt-8 pb-4 flex justify-between items-end">
                <div>
                  <h2 className="text-xl md:text-2xl font-extrabold text-slate-900 tracking-tight">
                    {viewMode === 'Overview' ? 'Workspace Dashboard' : viewMode === 'Today' ? "Today's Operational Flow" : `${viewMode === 'Client' ? clientLabel : (viewMode === 'Junior' ? juniorLabel : viewMode)} Dashboard`}
                  </h2>
                  <p className="text-slate-500 mt-1 font-medium text-xs md:text-sm">{currentOrg} &bull; {new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}</p>
                </div>
                {viewMode !== 'Overview' && (
                  <button onClick={() => setIsModalOpen(true)} className="hidden md:flex items-center gap-2 px-6 py-3 bg-white border border-slate-200 text-slate-900 font-bold rounded-xl hover:bg-slate-50 shadow-sm transition-all">
                    <Plus className="w-4 h-4" /> Add Entry
                  </button>
                )}
              </div>
              {viewMode === 'Overview' ? (
                <Dashboard tasks={currentOrgTasks} />
              ) : (
                <TaskBoard 
                  tasks={currentOrgTasks} 
                  viewMode={viewMode} 
                  onStatusChange={updateTaskStatus} 
                  onDelete={deleteTask}
                  clientLabel={clientLabel} 
                  juniorLabel={juniorLabel} 
                />
              )}
            </>
          )}
        </div>

        {/* Floating Confirmation Toast */}
        {lastConfirmation && (
          <div className="fixed top-8 left-1/2 -translate-x-1/2 z-[200] animate-in slide-in-from-top-4 duration-300">
            <div className="bg-slate-900 text-white px-6 py-3 rounded-2xl shadow-2xl flex items-center gap-3">
              <Database className="w-4 h-4 text-emerald-400" />
              <span className="text-sm font-bold">{lastConfirmation}</span>
            </div>
          </div>
        )}

        {/* Mobile Bottom Navigation */}
        <div className="md:hidden fixed bottom-6 left-4 right-4 z-[100] animate-in slide-in-from-bottom-8 duration-500">
          <div className="bg-white/90 backdrop-blur-xl border border-slate-200 shadow-2xl rounded-[32px] flex items-center justify-around py-2 px-1 relative">
            <MobileNavItem 
              active={viewMode === 'Overview'} 
              icon={LayoutDashboard} 
              label="Home" 
              onClick={() => { setViewMode('Overview'); setIsMobileMenuOpen(false); }} 
            />
            <MobileNavItem 
              active={viewMode === 'Today'} 
              icon={Star} 
              label="Priority" 
              onClick={() => { setViewMode('Today'); setIsMobileMenuOpen(false); }} 
            />
            <MobileNavItem 
              active={viewMode === 'Client'} 
              icon={ClientIcon} 
              label={currentOrg === 'EY' ? 'Clients' : 'Sewa'} 
              onClick={() => { setViewMode('Client'); setIsMobileMenuOpen(false); }} 
            />
            <MobileNavItem 
              active={viewMode === 'Junior'} 
              icon={Users} 
              label={currentOrg === 'EY' ? 'People' : 'Sewadars'} 
              onClick={() => { setViewMode('Junior'); setIsMobileMenuOpen(false); }} 
            />
            <MobileNavItem 
              active={isMobileMenuOpen} 
              icon={MoreHorizontal} 
              label="More" 
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} 
            />

            {isMobileMenuOpen && (
              <div className="absolute bottom-[calc(100%+12px)] left-0 right-0 animate-in slide-in-from-bottom-4 fade-in duration-300">
                <div className="bg-white border border-slate-200 shadow-2xl rounded-3xl p-4 flex flex-col gap-2">
                   <h4 className="px-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Extended Tools</h4>
                   <button onClick={() => { setViewMode('Category'); setIsMobileMenuOpen(false); }} className="flex items-center gap-3 px-4 py-3 w-full rounded-xl transition-all duration-200 hover:bg-slate-100 text-slate-600 font-semibold text-sm">
                    <Filter className="w-5 h-5" /> By Category
                   </button>
                   <button onClick={() => { setIsExtractionModalOpen(true); setIsMobileMenuOpen(false); }} className="flex items-center gap-3 px-4 py-3 w-full rounded-xl transition-all duration-200 hover:bg-blue-50 text-blue-600 font-bold text-sm">
                    <Sparkles className="w-5 h-5" /> Extract Actions
                   </button>
                   <button onClick={() => { setIsNudgeModalOpen(true); setIsMobileMenuOpen(false); }} className="flex items-center gap-3 px-4 py-3 w-full rounded-xl transition-all duration-200 hover:bg-indigo-50 text-indigo-600 font-bold text-sm">
                    <MessageSquare className="w-5 h-5" /> Nudge Agent
                   </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      <TaskModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onSave={addTask} existingClients={existingClients} existingJuniors={existingJuniors} clientLabel={clientLabel} juniorLabel={juniorLabel} />
      <ProfileModal isOpen={isProfileModalOpen} onClose={() => setIsProfileModalOpen(false)} onSave={(n, d) => { setUserName(n); setUserDesignation(d); }} currentName={userName} currentDesignation={userDesignation} />
      <ActionExtractionModal isOpen={isExtractionModalOpen} onClose={() => setIsExtractionModalOpen(false)} onConfirm={handleConfirmExtracted} clientLabel={clientLabel} />
      <FollowUpModal isOpen={isNudgeModalOpen} onClose={() => setIsNudgeModalOpen(false)} tasks={currentOrgTasks} userName={userName} />
    </div>
  );
}

const MobileNavItem = ({ active, icon: Icon, label, onClick }: { active: boolean, icon: any, label: string, onClick: () => void }) => (
  <button onClick={onClick} className="flex flex-col items-center justify-center py-2 px-1 flex-1 relative transition-all duration-300">
    <div className={`p-2 rounded-2xl transition-all duration-300 mb-0.5 ${active ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30 -translate-y-1' : 'text-slate-400'}`}>
      <Icon className={`w-5 h-5 ${active ? 'scale-110' : 'scale-100'}`} />
    </div>
    <span className={`text-[9px] font-bold tracking-tight transition-all ${active ? 'text-blue-600' : 'text-slate-400'}`}>
      {label}
    </span>
    {active && (
      <div className="absolute -top-1 w-1 h-1 bg-blue-600 rounded-full animate-pulse" />
    )}
  </button>
);

export default App;