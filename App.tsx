import React, { useState, useMemo, useEffect } from 'react';
import { Users, Briefcase, Filter, Scale, Plus, Building2, LogOut, Settings, Database, Star, HeartHandshake, Sparkles, MessageSquare, Loader2, BarChart3, LayoutDashboard, MoreHorizontal, ChevronRight, AlertTriangle, RefreshCw } from 'lucide-react';
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
      className={`flex items-center gap-3 px-4 py-3 w-full rounded-xl transition-all duration-300 ${
        mode === viewMode 
          ? 'bg-[#F0C040] text-slate-900 shadow-xl shadow-[#F0C040]/10' 
          : 'text-slate-400 hover:bg-white/5 hover:text-white'
      }`}
    >
      <Icon className="w-5 h-5" />
      <span className="font-medium text-sm">{label}</span>
    </button>
  );

  const getInitials = (name: string) => name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);

  if (!currentOrg) {
    return (
      <div className="min-h-screen bg-[#0A0F1A] flex items-center justify-center p-6 font-sans relative overflow-hidden">
        {/* Dynamic Background */}
        <div className="absolute top-0 left-0 w-full h-full pointer-events-none">
          <div className="absolute top-0 left-0 w-[60%] h-[60%] bg-[radial-gradient(circle,rgba(14,165,233,0.15),transparent_70%)]" />
          <div className="absolute bottom-0 right-0 w-[60%] h-[60%] bg-[radial-gradient(circle,rgba(30,27,75,0.2),transparent_70%)]" />
          <div className="absolute top-[15%] left-[10%] w-[300px] h-[300px] bg-[#0EA5E9]/10 blur-[80px] rounded-full animate-float" style={{ animationDelay: '0s' }} />
          <div className="absolute bottom-[20%] right-[15%] w-[350px] h-[350px] bg-[#4F46E5]/10 blur-[80px] rounded-full animate-float" style={{ animationDelay: '-4s' }} />
          <div className="absolute top-[40%] right-[30%] w-[250px] h-[250px] bg-[#F0C040]/5 blur-[80px] rounded-full animate-float" style={{ animationDelay: '-8s' }} />
        </div>

        <div className="w-full max-w-[480px] relative z-10 animate-slide-up-custom">
          <div className="bg-white/[0.08] backdrop-blur-[28px] border border-white/[0.15] rounded-[24px] p-[48px_36px] shadow-[0_32px_80px_rgba(0,0,0,0.4)] relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-white/30 to-transparent" />
            <div className="flex justify-center mb-8 animate-scale-in-custom" style={{ animationDelay: '0.1s' }}>
              <div className="w-[72px] h-[72px] rounded-[20px] bg-gradient-to-br from-[#c9a84c]/30 to-[#e8c97a]/15 border border-[#c9a84c]/40 flex items-center justify-center shadow-[0_10px_30px_rgba(201,168,76,0.15)] ring-1 ring-white/5">
                <Scale className="w-8 h-8 text-[#e8c97a] drop-shadow-[0_0_8px_rgba(232,201,122,0.5)]" />
              </div>
            </div>
            <div className="text-center mb-10">
              <h1 className="text-[34px] font-semibold text-white font-serif-elegant tracking-tight leading-none mb-4">Executive Ops</h1>
              <p className="text-white/50 text-[13px] font-medium tracking-[0.1em] uppercase">Select Workspace to Begin</p>
            </div>
            <div className="w-full flex items-center gap-4 mb-8">
              <div className="flex-1 h-[1px] bg-white/10" />
              <span className="text-[10px] font-bold text-white/40 tracking-[0.15em] uppercase whitespace-nowrap">Workspaces</span>
              <div className="flex-1 h-[1px] bg-white/10" />
            </div>
            <div className="w-full space-y-[14px]">
              <button 
                onClick={() => setCurrentOrg('EY')}
                className="w-full group bg-white/[0.08] hover:bg-white/[0.14] border border-white/[0.14] p-[18px_20px] rounded-[16px] flex items-center gap-4 transition-all duration-300 transform hover:-translate-y-0.5 hover:shadow-[0_10px_40px_rgba(0,0,0,0.2)] active:scale-[0.98]"
              >
                <div className="w-[50px] h-[50px] rounded-[12px] bg-gradient-to-br from-[#F0C040] to-[#F5D778] flex items-center justify-center shrink-0 shadow-lg group-hover:scale-105 transition-transform duration-300">
                  <span className="text-[16px] font-black text-slate-900">EY</span>
                </div>
                <div className="text-left flex-1 min-w-0">
                  <h2 className="text-[20px] font-semibold text-white font-serif-elegant leading-tight">EY Workspace</h2>
                  <p className="text-[12px] text-white/45 font-medium truncate">Ernst & Young Operations</p>
                </div>
                <div className="w-[28px] h-[28px] rounded-full bg-white/[0.08] flex items-center justify-center text-white/60 group-hover:text-white transition-colors">
                  <ChevronRight className="w-4 h-4" />
                </div>
              </button>
              <button 
                onClick={() => setCurrentOrg('SKRM')}
                className="w-full group bg-white/[0.08] hover:bg-white/[0.14] border border-white/[0.14] p-[18px_20px] rounded-[16px] flex items-center gap-4 transition-all duration-300 transform hover:-translate-y-0.5 hover:shadow-[0_10px_40px_rgba(0,0,0,0.2)] active:scale-[0.98]"
              >
                <div className="w-[50px] h-[50px] rounded-[12px] bg-gradient-to-br from-[#1E1B4B] to-[#2D2A6E] flex items-center justify-center shrink-0 shadow-lg group-hover:scale-105 transition-transform duration-300">
                  <span className="text-[11px] font-black text-white">SKRM</span>
                </div>
                <div className="text-left flex-1 min-w-0">
                  <h2 className="text-[20px] font-semibold text-white font-serif-elegant leading-tight">SKRM Workspace</h2>
                  <p className="text-[12px] text-white/45 font-medium truncate">SKRM Operations Suite</p>
                </div>
                <div className="w-[28px] h-[28px] rounded-full bg-white/[0.08] flex items-center justify-center text-white/60 group-hover:text-white transition-colors">
                  <ChevronRight className="w-4 h-4" />
                </div>
              </button>
            </div>
            <div className="mt-12 text-center">
              <p className="text-[11px] font-medium text-white/25 tracking-[0.08em] uppercase">Authorized Access Only</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0A0F1A] flex font-sans text-white transition-colors duration-500 overflow-hidden relative">
      {/* Permanent Background Glows */}
      <div className="absolute top-0 left-0 w-[50%] h-[50%] bg-blue-600/5 blur-[120px] rounded-full pointer-events-none z-0" />
      <div className="absolute bottom-0 right-0 w-[50%] h-[50%] bg-indigo-600/5 blur-[120px] rounded-full pointer-events-none z-0" />
      <div className="absolute top-[30%] right-[10%] w-[30%] h-[30%] bg-[#F0C040]/5 blur-[120px] rounded-full pointer-events-none z-0" />

      {/* Sidebar */}
      <aside className="w-72 bg-[#0D1525]/80 backdrop-blur-3xl border-r border-white/5 flex flex-col fixed inset-y-0 left-0 z-10 hidden md:flex transition-all duration-500">
        <div className="p-8 overflow-y-auto custom-scrollbar">
          <div className="flex items-center gap-3 mb-10">
            <div className={`p-2 rounded-xl ${currentOrg === 'EY' ? 'bg-[#F0C040] text-slate-900 shadow-lg shadow-[#F0C040]/10' : 'bg-white text-slate-900'}`}>
              <Building2 className="w-6 h-6" />
            </div>
            <div>
              <h1 className="font-serif-elegant text-xl leading-tight text-white">{currentOrg}</h1>
              <p className="text-[10px] text-white/40 font-bold tracking-widest uppercase">Workspace</p>
            </div>
          </div>
          <nav className="space-y-1">
            <NavButton mode="Overview" icon={LayoutDashboard} label="Executive Overview" />
            <NavButton mode="Today" icon={Star} label="Today's Priority" />
            <NavButton mode="Client" icon={ClientIcon} label={`By ${clientLabel}`} />
            <NavButton mode="Category" icon={Filter} label="By Category" />
            <NavButton mode="Junior" icon={Users} label={`By ${juniorLabel}`} />
            
            <div className="mt-8 pt-8 border-t border-white/5">
              <h4 className="px-4 text-[10px] font-bold text-white/30 uppercase tracking-widest mb-3">AI Intelligence</h4>
              <button onClick={() => setIsExtractionModalOpen(true)} className="flex items-center gap-3 px-4 py-3 w-full rounded-xl transition-all duration-200 text-blue-400 hover:bg-white/5 font-bold">
                <span className="shrink-0"><Sparkles className="w-5 h-5" /></span>
                <span className="text-sm">Extract Actions</span>
              </button>
              <button onClick={() => setIsNudgeModalOpen(true)} className="flex items-center gap-3 px-4 py-3 w-full rounded-xl transition-all duration-200 text-indigo-400 hover:bg-white/5 font-bold mt-1">
                <span className="shrink-0"><MessageSquare className="w-5 h-5" /></span>
                <span className="text-sm">Nudge Agent</span>
              </button>
            </div>
          </nav>
        </div>
        <div className="mt-auto p-8 border-t border-white/5 space-y-5">
          <button onClick={() => setIsProfileModalOpen(true)} className="flex items-center gap-3 w-full p-2 rounded-2xl hover:bg-white/5 transition-all text-left group">
            <div className="w-12 h-12 rounded-full bg-white/5 text-white/80 flex items-center justify-center shrink-0 border border-white/10 shadow-inner">
              <span className="font-bold">{getInitials(userName)}</span>
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-bold truncate text-white">{userName}</p>
              <p className="text-[10px] text-white/30 font-medium truncate uppercase tracking-tighter">{userDesignation}</p>
            </div>
            <Settings className="w-4 h-4 text-white/20" />
          </button>
          <button onClick={() => setCurrentOrg(null)} className="flex items-center gap-2 text-[11px] font-bold text-rose-400 hover:text-rose-500 w-full px-2 uppercase tracking-widest transition-colors">
            <LogOut className="w-3.5 h-3.5" /> Switch Workspace
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 md:ml-72 relative flex flex-col min-h-screen pb-24 md:pb-12 bg-transparent transition-all duration-500 z-10 overflow-y-auto custom-scrollbar">
        {isLoading ? (
             <div className="flex flex-col items-center justify-center h-full">
               <Loader2 className="w-10 h-10 text-white animate-spin" />
               <p className="text-white/40 mt-6 font-medium uppercase tracking-[0.2em] text-[10px]">Syncing secure data...</p>
             </div>
          ) : fetchError ? (
            <div className="flex flex-col items-center justify-center h-full p-8 text-center max-w-md mx-auto">
               <div className="w-20 h-20 bg-rose-500/10 text-rose-500 rounded-3xl flex items-center justify-center mb-6">
                 <AlertTriangle className="w-10 h-10" />
               </div>
               <h3 className="text-xl font-serif-elegant text-white">Database Connection Failed</h3>
               <p className="text-white/40 mt-3 text-sm leading-relaxed">{fetchError}</p>
               <button 
                onClick={() => window.location.reload()}
                className="mt-8 px-8 py-3 bg-[#F0C040] text-slate-900 rounded-xl font-bold text-sm shadow-xl transition-all"
               >
                 Retry Handshake
               </button>
             </div>
          ) : (
            <>
              {viewMode !== 'Overview' && (
                <div className="px-8 md:px-12 pt-12 pb-6 flex justify-between items-end relative z-10">
                  <div>
                    <p className="text-[#F0C040] text-[11px] font-bold tracking-[0.2em] uppercase mb-2">Workspace</p>
                    <h2 className="text-3xl md:text-5xl font-serif-elegant text-white tracking-tight leading-none">
                      {viewMode === 'Today' ? "Today's Flow" : `${viewMode === 'Client' ? clientLabel : (viewMode === 'Junior' ? juniorLabel : viewMode)}`}
                    </h2>
                    <p className="text-white/30 mt-3 font-medium text-xs md:text-sm uppercase tracking-widest">
                      {currentOrg} Operations &bull; {new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}
                    </p>
                  </div>
                  <button onClick={() => setIsModalOpen(true)} className="hidden md:flex items-center gap-2 px-8 py-3.5 bg-[#F0C040] text-slate-900 font-bold rounded-xl hover:scale-105 shadow-2xl transition-all active:scale-95">
                    <Plus className="w-4 h-4" /> Add Record
                  </button>
                </div>
              )}
              {viewMode === 'Overview' ? (
                <Dashboard 
                  tasks={currentOrgTasks} 
                  onAddClick={() => setIsModalOpen(true)}
                  orgName={currentOrg || ''} 
                />
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

        {/* Mobile Bottom Navigation */}
        <div className="md:hidden fixed bottom-8 left-6 right-6 z-[100]">
          <div className="bg-[#151B2B]/90 backdrop-blur-2xl border border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.5)] rounded-[32px] flex items-center justify-around py-2.5 px-2 relative">
            <MobileNavItem active={viewMode === 'Overview'} icon={LayoutDashboard} label="Home" onClick={() => { setViewMode('Overview'); setIsMobileMenuOpen(false); }} />
            <MobileNavItem active={viewMode === 'Today'} icon={Star} label="Priority" onClick={() => { setViewMode('Today'); setIsMobileMenuOpen(false); }} />
            <MobileNavItem active={viewMode === 'Client'} icon={ClientIcon} label={currentOrg === 'EY' ? 'Clients' : 'Sewa'} onClick={() => { setViewMode('Client'); setIsMobileMenuOpen(false); }} />
            <MobileNavItem active={viewMode === 'Junior'} icon={Users} label={currentOrg === 'EY' ? 'People' : 'Sewadars'} onClick={() => { setViewMode('Junior'); setIsMobileMenuOpen(false); }} />
            <MobileNavItem active={isMobileMenuOpen} icon={MoreHorizontal} label="More" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} />

            {isMobileMenuOpen && (
              <>
                {/* Backdrop overlay to increase focus on the menu */}
                <div 
                  className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[-1] rounded-[32px] animate-in fade-in duration-300"
                  onClick={() => setIsMobileMenuOpen(false)}
                />
                
                <div className="absolute bottom-[calc(100%+16px)] left-0 right-0 animate-in slide-in-from-bottom-6 fade-in duration-400">
                  <div className="bg-[#0D1525] border border-[#F0C040]/30 shadow-[0_0_60px_rgba(0,0,0,1)] rounded-[32px] p-6 flex flex-col gap-3 relative z-[101]">
                     <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-12 h-1 bg-white/20 rounded-full" />
                     <h4 className="px-4 text-[10px] font-black text-[#F0C040] uppercase tracking-[0.2em] mb-2 opacity-80">Operational Controls</h4>
                     
                     <button onClick={() => { setViewMode('Category'); setIsMobileMenuOpen(false); }} className="flex items-center gap-4 px-4 py-4 w-full rounded-2xl hover:bg-white/5 text-white font-semibold text-sm transition-all border border-white/5 hover:border-[#F0C040]/30 group">
                      <Filter className="w-5 h-5 text-slate-400 group-hover:text-[#F0C040] transition-colors" /> By Category
                     </button>
                     
                     <button onClick={() => { setIsExtractionModalOpen(true); setIsMobileMenuOpen(false); }} className="flex items-center gap-4 px-4 py-4 w-full rounded-2xl hover:bg-blue-600/10 text-blue-400 font-bold text-sm transition-all border border-white/5 hover:border-blue-500/30 group">
                      <Sparkles className="w-5 h-5 group-hover:scale-110 transition-transform" /> Extract Actions
                     </button>
                     
                     <button onClick={() => { setIsNudgeModalOpen(true); setIsMobileMenuOpen(false); }} className="flex items-center gap-4 px-4 py-4 w-full rounded-2xl hover:bg-indigo-600/10 text-indigo-400 font-bold text-sm transition-all border border-white/5 hover:border-indigo-500/30 group">
                      <MessageSquare className="w-5 h-5 group-hover:scale-110 transition-transform" /> Nudge Agent
                     </button>
                     
                     <div className="h-[1px] bg-white/10 my-2" />
                     
                     <button onClick={() => { setCurrentOrg(null); setIsMobileMenuOpen(false); }} className="flex items-center gap-4 px-4 py-4 w-full rounded-2xl bg-rose-500/5 hover:bg-rose-500/10 text-rose-500 font-bold text-sm transition-all border border-rose-500/20 hover:border-rose-500/40 group">
                      <RefreshCw className="w-5 h-5 group-hover:rotate-180 transition-transform duration-500" /> Switch Workspace
                     </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </main>

      <TaskModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onSave={addTask} existingClients={existingClients} existingJuniors={existingJuniors} clientLabel={clientLabel} juniorLabel={juniorLabel} />
      <ProfileModal isOpen={isProfileModalOpen} onClose={() => setIsProfileModalOpen(false)} onSave={(n, d) => { setUserName(n); setUserDesignation(d); }} currentName={userName} currentDesignation={userDesignation} />
      <ActionExtractionModal isOpen={isExtractionModalOpen} onClose={() => setIsExtractionModalOpen(false)} onConfirm={handleConfirmExtracted} clientLabel={clientLabel} />
      <FollowUpModal isOpen={isNudgeModalOpen} onClose={() => setIsNudgeModalOpen(false)} tasks={currentOrgTasks} userName={userName} />
      
      {/* Floating Confirmation Toast */}
      {lastConfirmation && (
        <div className="fixed top-10 left-1/2 -translate-x-1/2 z-[200] animate-in slide-in-from-top-6 duration-500">
          <div className="bg-slate-900 text-white px-8 py-4 rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] flex items-center gap-4 border border-white/10 backdrop-blur-xl">
            <Database className="w-5 h-5 text-[#F0C040]" />
            <span className="text-sm font-bold tracking-tight">{lastConfirmation}</span>
          </div>
        </div>
      )}
    </div>
  );
}

const MobileNavItem = ({ active, icon: Icon, label, onClick }: { active: boolean, icon: any, label: string, onClick: () => void }) => (
  <button onClick={onClick} className="flex flex-col items-center justify-center py-2 px-1 flex-1 relative transition-all duration-300">
    <div className={`p-2.5 rounded-2xl transition-all duration-300 mb-0.5 ${active ? 'bg-[#F0C040] text-slate-900 shadow-xl -translate-y-1' : 'text-slate-500'}`}>
      <Icon className={`w-5 h-5 ${active ? 'scale-110' : 'scale-100'}`} />
    </div>
    <span className={`text-[8px] font-bold tracking-widest transition-all uppercase ${active ? 'text-white' : 'text-slate-500'}`}>{label}</span>
  </button>
);

export default App;
