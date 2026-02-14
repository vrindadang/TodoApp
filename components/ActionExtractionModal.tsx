import React, { useState, useRef } from 'react';
import { X, Upload, FileText, Loader2, CheckCircle2, AlertCircle, Sparkles, Plus } from 'lucide-react';
import { extractActionablesFromImage } from '../services/geminiService';
import { ExtractedActionable, Task, Category, Priority, Status } from '../types';

interface ActionExtractionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (tasks: ExtractedActionable[]) => void;
  clientLabel: string;
}

export const ActionExtractionModal: React.FC<ActionExtractionModalProps> = ({ isOpen, onClose, onConfirm, clientLabel }) => {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [isExtracting, setIsExtracting] = useState(false);
  const [extractedTasks, setExtractedTasks] = useState<ExtractedActionable[]>([]);
  const [selectedIndices, setSelectedIndices] = useState<Set<number>>(new Set());
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      const reader = new FileReader();
      reader.onloadend = () => setPreview(reader.result as string);
      reader.readAsDataURL(selectedFile);
      setExtractedTasks([]);
    }
  };

  const handleExtract = async () => {
    if (!preview || !file) return;
    setIsExtracting(true);
    const base64Data = preview.split(',')[1];
    const results = await extractActionablesFromImage(base64Data, file.type);
    setExtractedTasks(results);
    setSelectedIndices(new Set(results.map((_, i) => i)));
    setIsExtracting(false);
  };

  const toggleSelection = (index: number) => {
    const next = new Set(selectedIndices);
    if (next.has(index)) next.delete(index);
    else next.add(index);
    setSelectedIndices(next);
  };

  const handleCommit = () => {
    const selectedTasks = extractedTasks.filter((_, i) => selectedIndices.has(i));
    onConfirm(selectedTasks);
    reset();
    onClose();
  };

  const reset = () => {
    setFile(null);
    setPreview(null);
    setExtractedTasks([]);
    setSelectedIndices(new Set());
  };

  return (
    <div className="fixed inset-0 z-[130] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-300">
      <div className="bg-white w-full max-w-4xl rounded-3xl shadow-2xl border border-slate-200 overflow-hidden animate-in zoom-in-95 duration-300 flex flex-col max-h-[90vh]">
        <div className="px-8 py-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-blue-600 rounded-xl shadow-lg shadow-blue-600/20">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-xl tracking-tight">Smart Actionable Extraction</h3>
              <p className="text-sm text-slate-500 font-medium">Upload meeting notes to auto-detect tasks</p>
            </div>
          </div>
          <button onClick={() => { reset(); onClose(); }} className="p-2 hover:bg-slate-200 rounded-full transition-colors text-slate-400">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="flex-1 overflow-hidden flex flex-col md:flex-row">
          {/* Left: Upload/Preview */}
          <div className="w-full md:w-1/2 p-8 border-r border-slate-100 flex flex-col">
            <div 
              onClick={() => fileInputRef.current?.click()}
              className={`flex-1 border-2 border-dashed rounded-3xl flex flex-col items-center justify-center p-8 transition-all cursor-pointer group ${
                preview ? 'border-blue-500 bg-blue-50/30' : 'border-slate-200 hover:border-blue-400 hover:bg-slate-50'
              }`}
            >
              {preview ? (
                <div className="relative w-full h-full flex items-center justify-center overflow-hidden rounded-2xl">
                  <img src={preview} alt="Notes Preview" className="max-w-full max-h-full object-contain shadow-lg" />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <p className="text-white font-bold flex items-center gap-2 bg-black/20 px-4 py-2 rounded-full backdrop-blur-md">
                      <Upload className="w-4 h-4" /> Change Image
                    </p>
                  </div>
                </div>
              ) : (
                <>
                  <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                    <Upload className="w-8 h-8" />
                  </div>
                  <h4 className="font-bold text-slate-900 mb-1">Upload Meeting Notes</h4>
                  <p className="text-slate-500 text-sm text-center">Drag and drop or click to select image or screenshot from OneNote/iPad</p>
                </>
              )}
              <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*" className="hidden" />
            </div>
            
            <button
              onClick={handleExtract}
              disabled={!preview || isExtracting}
              className="mt-6 w-full py-4 bg-blue-600 text-white font-bold rounded-2xl hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-xl shadow-blue-600/20 transition-all flex items-center justify-center gap-3 active:scale-[0.98]"
            >
              {isExtracting ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Analyzing Notes...
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5" />
                  Extract Actionables
                </>
              )}
            </button>
          </div>

          {/* Right: Results Review */}
          <div className="w-full md:w-1/2 bg-slate-50/50 flex flex-col">
            <div className="p-6 border-b border-slate-100 bg-white">
              <h4 className="font-bold text-slate-800 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                Review Detected Tasks ({extractedTasks.length})
              </h4>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {extractedTasks.length === 0 && !isExtracting && (
                <div className="h-full flex flex-col items-center justify-center text-center p-8">
                  <FileText className="w-12 h-12 text-slate-200 mb-4" />
                  <p className="text-slate-400 font-medium italic">Detection results will appear here after analysis</p>
                </div>
              )}

              {isExtracting && (
                <div className="space-y-4">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="animate-pulse bg-white p-4 rounded-2xl border border-slate-100 space-y-3 shadow-sm">
                      <div className="h-4 bg-slate-100 rounded w-3/4" />
                      <div className="h-3 bg-slate-100 rounded w-1/2" />
                    </div>
                  ))}
                </div>
              )}

              {extractedTasks.map((task, idx) => (
                <div 
                  key={idx} 
                  onClick={() => toggleSelection(idx)}
                  className={`p-4 rounded-2xl border-2 transition-all cursor-pointer bg-white shadow-sm hover:shadow-md ${
                    selectedIndices.has(idx) ? 'border-blue-500 ring-2 ring-blue-500/10' : 'border-white'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className={`mt-1 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${
                      selectedIndices.has(idx) ? 'bg-blue-600 border-blue-600' : 'border-slate-300'
                    }`}>
                      {selectedIndices.has(idx) && <CheckCircle2 className="w-3.5 h-3.5 text-white" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h5 className="text-sm font-bold text-slate-900 leading-snug">{task.description}</h5>
                      <div className="mt-2 flex flex-wrap gap-2 text-[10px]">
                        <span className="px-2 py-0.5 bg-slate-100 rounded-md font-bold uppercase tracking-wider text-slate-500">
                          {task.client}
                        </span>
                        <span className="px-2 py-0.5 bg-blue-50 rounded-md font-bold uppercase tracking-wider text-blue-600">
                          {task.category}
                        </span>
                        {task.deadline && (
                          <span className="px-2 py-0.5 bg-rose-50 rounded-md font-bold uppercase tracking-wider text-rose-600">
                            Due: {task.deadline}
                          </span>
                        )}
                        {task.suggestedJunior && (
                          <span className="px-2 py-0.5 bg-emerald-50 rounded-md font-bold uppercase tracking-wider text-emerald-600">
                            For: {task.suggestedJunior}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="p-6 bg-white border-t border-slate-100">
              <button
                onClick={handleCommit}
                disabled={selectedIndices.size === 0}
                className="w-full py-4 bg-slate-900 text-white font-bold rounded-2xl hover:bg-black disabled:opacity-50 transition-all flex items-center justify-center gap-2 shadow-xl shadow-slate-900/10"
              >
                <Plus className="w-5 h-5" />
                Commit {selectedIndices.size} Selected {selectedIndices.size === 1 ? 'Task' : 'Tasks'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
