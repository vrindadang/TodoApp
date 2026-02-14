import React, { useState, useRef } from 'react';
import { X, Plus, Trash2, Users, Briefcase, FileUp, Loader2, HeartHandshake } from 'lucide-react';
import * as XLSX from 'https://esm.sh/xlsx';

interface MasterListModalProps {
  isOpen: boolean;
  onClose: () => void;
  clients: string[];
  juniors: string[];
  onUpdateClients: (clients: string[]) => void;
  onUpdateJuniors: (juniors: string[]) => void;
  clientLabel: string;
}

export const MasterListModal: React.FC<MasterListModalProps> = ({
  isOpen,
  onClose,
  clients,
  juniors,
  onUpdateClients,
  onUpdateJuniors,
  clientLabel
}) => {
  const [newClient, setNewClient] = useState('');
  const [newJunior, setNewJunior] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const addItem = (type: 'client' | 'junior') => {
    if (type === 'client' && newClient.trim()) {
      if (!clients.includes(newClient.trim())) {
        onUpdateClients([...clients, newClient.trim()].sort());
      }
      setNewClient('');
    } else if (type === 'junior' && newJunior.trim()) {
      if (!juniors.includes(newJunior.trim())) {
        onUpdateJuniors([...juniors, newJunior.trim()].sort());
      }
      setNewJunior('');
    }
  };

  const removeItem = (type: 'client' | 'junior', item: string) => {
    if (type === 'client') {
      onUpdateClients(clients.filter((c) => c !== item));
    } else {
      onUpdateJuniors(juniors.filter((j) => j !== item));
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const data = XLSX.utils.sheet_to_json(ws, { header: 1 }) as any[][];
        
        const extractedClients = data
          .map(row => row[0])
          .filter(val => typeof val === 'string' && val.trim().length > 0)
          .map(val => val.trim());

        const mergedClients = Array.from(new Set([...clients, ...extractedClients])).sort();
        onUpdateClients(mergedClients);
      } catch (error) {
        console.error("Error parsing Excel file:", error);
        alert("Failed to parse Excel file. Please ensure it's a valid .xlsx or .csv file.");
      } finally {
        setIsUploading(false);
        if (fileInputRef.current) fileInputRef.current.value = '';
      }
    };
    reader.readAsBinaryString(file);
  };

  const ClientIcon = clientLabel === 'Sewa Category' ? HeartHandshake : Briefcase;

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[80vh]">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50 shrink-0">
          <div>
            <h3 className="font-bold text-slate-900 text-lg">Master Lists</h3>
            <p className="text-xs text-slate-500 font-medium">Manage reusable entries for faster logging</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-lg transition-colors text-slate-400 hover:text-slate-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Client/Sewa List */}
          <div className="space-y-4">
            <div className="flex items-center justify-between text-blue-600 mb-2">
              <div className="flex items-center gap-2">
                <ClientIcon className="w-4 h-4" />
                <h4 className="text-xs font-bold uppercase tracking-wider">{clientLabel} Master</h4>
              </div>
              <button 
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
                className="flex items-center gap-1.5 text-[10px] font-bold bg-blue-50 hover:bg-blue-100 px-2 py-1 rounded-md transition-colors disabled:opacity-50"
              >
                {isUploading ? <Loader2 className="w-3 h-3 animate-spin" /> : <FileUp className="w-3 h-3" />}
                Bulk Upload
              </button>
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleFileUpload} 
                accept=".xlsx, .xls, .csv" 
                className="hidden" 
              />
            </div>
            
            <div className="flex gap-2">
              <input
                type="text"
                value={newClient}
                onChange={(e) => setNewClient(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && addItem('client')}
                placeholder={`New ${clientLabel.toLowerCase()}...`}
                className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
              <button
                onClick={() => addItem('client')}
                className="p-2 bg-slate-900 text-white rounded-lg hover:bg-black transition-colors"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-1 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
              {clients.length === 0 && (
                <p className="text-center py-8 text-slate-400 text-xs italic">No entries found</p>
              )}
              {clients.map((client) => (
                <div key={client} className="flex items-center justify-between p-2 bg-slate-50 rounded-lg group hover:bg-slate-100 transition-colors">
                  <span className="text-sm font-medium text-slate-700">{client}</span>
                  <button
                    onClick={() => removeItem('client', client)}
                    className="p-1.5 text-slate-400 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-all"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Junior List */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-indigo-600 mb-2">
              <Users className="w-4 h-4" />
              <h4 className="text-xs font-bold uppercase tracking-wider">Associate Master</h4>
            </div>
            
            <div className="flex gap-2">
              <input
                type="text"
                value={newJunior}
                onChange={(e) => setNewJunior(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && addItem('junior')}
                placeholder="New associate..."
                className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              />
              <button
                onClick={() => addItem('junior')}
                className="p-2 bg-slate-900 text-white rounded-lg hover:bg-black transition-colors"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-1 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
              {juniors.length === 0 && (
                <p className="text-center py-8 text-slate-400 text-xs italic">No entries found</p>
              )}
              {juniors.map((junior) => (
                <div key={junior} className="flex items-center justify-between p-2 bg-slate-50 rounded-lg group hover:bg-slate-100 transition-colors">
                  <span className="text-sm font-medium text-slate-700">{junior}</span>
                  <button
                    onClick={() => removeItem('junior', junior)}
                    className="p-1.5 text-slate-400 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-all"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/50 shrink-0 flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-slate-900 text-white font-bold rounded-xl hover:bg-black transition-all"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};