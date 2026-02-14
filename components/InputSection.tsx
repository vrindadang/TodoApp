import React, { useState } from 'react';
import { Send, Loader2 } from 'lucide-react';

interface InputSectionProps {
  onProcessInput: (input: string) => Promise<void>;
  isProcessing: boolean;
}

export const InputSection: React.FC<InputSectionProps> = ({ onProcessInput, isProcessing }) => {
  const [inputText, setInputText] = useState('');

  const handleSend = async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || isProcessing) return;
    
    setInputText('');
    await onProcessInput(trimmed);
  };

  return (
    <div className="sticky bottom-6 left-0 right-0 mx-auto w-full max-w-3xl px-4 z-50">
      <div className="bg-slate-900/90 backdrop-blur-md p-2 rounded-2xl shadow-2xl border border-slate-700 flex items-center gap-2">
        <input
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSend(inputText)}
          placeholder="Type your command: 'Add a deliverable for Tiger Global...'"
          className="flex-1 bg-transparent border-none outline-none text-white placeholder-slate-500 text-sm font-medium px-4"
          disabled={isProcessing}
        />

        <button
          onClick={() => handleSend(inputText)}
          disabled={isProcessing || !inputText.trim()}
          className="p-3 bg-blue-600 text-white rounded-xl hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isProcessing ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
        </button>
      </div>
    </div>
  );
};